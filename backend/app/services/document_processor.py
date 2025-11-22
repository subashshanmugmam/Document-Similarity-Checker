"""
Document Processing Service
Handles document ingestion, preprocessing, tokenization, and TF-IDF computation
"""

from typing import List, Dict, Tuple, Optional
from pathlib import Path
from datetime import datetime
import PyPDF2
import io

from pyspark.sql import DataFrame
from pyspark.sql.functions import col, lower, regexp_replace, trim, length, udf
from pyspark.sql.types import StringType, IntegerType, TimestampType, StructType, StructField
from pyspark.ml.feature import Tokenizer, StopWordsRemover, CountVectorizer, IDF, HashingTF
from pyspark.ml import Pipeline, PipelineModel

from app.services.spark_service import spark_service
from app.core.logging import get_logger
from app.core.exceptions import (
    DocumentProcessingException,
    SparkException,
    FileUploadException
)
from app.utils.helpers import TextProcessor, FileValidator

logger = get_logger(__name__)


class DocumentProcessor:
    """Document processing with PySpark"""
    
    def __init__(self):
        """Initialize document processor"""
        self.spark = spark_service.get_session()
        self.text_processor = TextProcessor()
        self.file_validator = FileValidator()
        self._pipeline_model: Optional[PipelineModel] = None
    
    def read_text_file(self, file_path: Path) -> str:
        """
        Read text from .txt file
        
        Args:
            file_path: Path to text file
        
        Returns:
            File content as string
        
        Raises:
            DocumentProcessingException: If reading fails
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            if not content or len(content.strip()) == 0:
                raise DocumentProcessingException(
                    f"File is empty: {file_path.name}",
                    details={'file': str(file_path)}
                )
            
            return content
            
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    content = f.read()
                return content
            except Exception as e:
                raise DocumentProcessingException(
                    f"Failed to read text file: {str(e)}",
                    details={'file': str(file_path), 'error': str(e)}
                )
        except Exception as e:
            raise DocumentProcessingException(
                f"Failed to read text file: {str(e)}",
                details={'file': str(file_path), 'error': str(e)}
            )
    
    def read_pdf_file(self, file_path: Path) -> str:
        """
        Read text from .pdf file
        
        Args:
            file_path: Path to PDF file
        
        Returns:
            Extracted text content
        
        Raises:
            DocumentProcessingException: If reading fails
        """
        try:
            content_parts = []
            
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                
                if len(pdf_reader.pages) == 0:
                    raise DocumentProcessingException(
                        f"PDF file has no pages: {file_path.name}",
                        details={'file': str(file_path)}
                    )
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        text = page.extract_text()
                        if text:
                            content_parts.append(text)
                    except Exception as e:
                        logger.warning(
                            f"Failed to extract text from page {page_num} "
                            f"of {file_path.name}: {str(e)}"
                        )
                        continue
            
            content = '\n'.join(content_parts)
            
            if not content or len(content.strip()) == 0:
                raise DocumentProcessingException(
                    f"No text extracted from PDF: {file_path.name}",
                    details={'file': str(file_path)}
                )
            
            return content
            
        except DocumentProcessingException:
            raise
        except Exception as e:
            raise DocumentProcessingException(
                f"Failed to read PDF file: {str(e)}",
                details={'file': str(file_path), 'error': str(e)}
            )
    
    def extract_document_content(self, file_path: Path) -> str:
        """
        Extract content from document (auto-detect type)
        
        Args:
            file_path: Path to document
        
        Returns:
            Extracted content
        
        Raises:
            DocumentProcessingException: If extraction fails
        """
        ext = file_path.suffix.lower()
        
        logger.debug(f"Extracting content from: {file_path.name}")
        
        if ext == '.txt':
            return self.read_text_file(file_path)
        elif ext == '.pdf':
            return self.read_pdf_file(file_path)
        else:
            raise DocumentProcessingException(
                f"Unsupported file type: {ext}",
                details={'file': str(file_path), 'extension': ext}
            )
    
    def create_documents_dataframe(
        self,
        documents: List[Dict[str, any]]
    ) -> DataFrame:
        """
        Create Spark DataFrame from documents
        
        Args:
            documents: List of document dictionaries with keys:
                - doc_id: Unique identifier
                - filename: Original filename
                - content: Document text content
                - upload_timestamp: Upload time
        
        Returns:
            Spark DataFrame with document data
        
        Raises:
            SparkException: If DataFrame creation fails
        """
        try:
            logger.info(f"Creating DataFrame from {len(documents)} documents")
            
            # Define schema
            schema = StructType([
                StructField("doc_id", StringType(), False),
                StructField("filename", StringType(), False),
                StructField("content", StringType(), False),
                StructField("upload_timestamp", TimestampType(), False)
            ])
            
            # Create DataFrame
            df = self.spark.createDataFrame(documents, schema=schema)
            
            # Validate
            if df.count() == 0:
                raise SparkException("Created DataFrame is empty")
            
            logger.info(f"DataFrame created: {df.count()} rows")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to create DataFrame: {str(e)}", exc_info=True)
            raise SparkException(
                f"Failed to create documents DataFrame: {str(e)}",
                details={'error': str(e), 'document_count': len(documents)}
            )
    
    def preprocess_text(self, df: DataFrame) -> DataFrame:
        """
        Preprocess text content in DataFrame
        
        Steps:
        1. Convert to lowercase
        2. Remove punctuation and special characters
        3. Normalize whitespace
        4. Handle null/empty documents
        
        Args:
            df: DataFrame with 'content' column
        
        Returns:
            DataFrame with 'cleaned_content' column
        
        Raises:
            SparkException: If preprocessing fails
        """
        try:
            logger.info("Preprocessing text content...")
            
            # Validate input
            spark_service.validate_dataframe(df, ['content'])
            
            # Convert to lowercase
            df = df.withColumn('cleaned_content', lower(col('content')))
            
            # Remove punctuation and special characters (keep only alphanumeric and spaces)
            df = df.withColumn(
                'cleaned_content',
                regexp_replace(col('cleaned_content'), r'[^a-z0-9\s]', ' ')
            )
            
            # Normalize whitespace (replace multiple spaces with single space)
            df = df.withColumn(
                'cleaned_content',
                regexp_replace(col('cleaned_content'), r'\s+', ' ')
            )
            
            # Trim leading/trailing whitespace
            df = df.withColumn('cleaned_content', trim(col('cleaned_content')))
            
            # Filter out empty documents
            initial_count = df.count()
            df = df.filter(length(col('cleaned_content')) > 0)
            final_count = df.count()
            
            if final_count < initial_count:
                logger.warning(
                    f"Filtered out {initial_count - final_count} empty documents"
                )
            
            if final_count == 0:
                raise SparkException("All documents are empty after preprocessing")
            
            logger.info(f"Text preprocessing completed: {final_count} documents")
            
            return df
            
        except SparkException:
            raise
        except Exception as e:
            logger.error(f"Text preprocessing failed: {str(e)}", exc_info=True)
            raise SparkException(
                f"Text preprocessing failed: {str(e)}",
                details={'error': str(e)}
            )
    
    def build_tfidf_pipeline(self) -> Pipeline:
        """
        Build TF-IDF feature engineering pipeline
        
        Pipeline stages:
        1. Tokenizer: Split text into words
        2. StopWordsRemover: Remove common words
        3. CountVectorizer: Create term frequency vectors
        4. IDF: Calculate inverse document frequency
        
        Returns:
            Configured ML Pipeline
        """
        logger.info("Building TF-IDF pipeline...")
        
        # Stage 1: Tokenization
        tokenizer = Tokenizer(
            inputCol="cleaned_content",
            outputCol="words"
        )
        
        # Stage 2: Stop words removal
        stop_words_remover = StopWordsRemover(
            inputCol="words",
            outputCol="filtered_words"
        )
        
        # Stage 3: Term Frequency (using CountVectorizer)
        # Use larger vocabulary size for better coverage
        count_vectorizer = CountVectorizer(
            inputCol="filtered_words",
            outputCol="raw_features",
            vocabSize=10000,  # Maximum vocabulary size
            minDF=1.0         # Minimum document frequency (absolute count)
        )
        
        # Stage 4: Inverse Document Frequency
        # Set minDocFreq=1 to ensure IDF doesn't become 0 for terms in all docs
        idf = IDF(
            inputCol="raw_features",
            outputCol="features",
            minDocFreq=1  # Minimum number of documents a term must appear in
        )
        
        # Create pipeline
        pipeline = Pipeline(stages=[
            tokenizer,
            stop_words_remover,
            count_vectorizer,
            idf
        ])
        
        logger.info("TF-IDF pipeline built successfully")
        
        return pipeline
    
    def compute_tfidf_features(self, df: DataFrame) -> Tuple[DataFrame, PipelineModel]:
        """
        Compute TF-IDF features for documents
        
        Args:
            df: DataFrame with 'cleaned_content' column
        
        Returns:
            Tuple of (DataFrame with features, fitted pipeline model)
        
        Raises:
            SparkException: If feature computation fails
        """
        try:
            logger.info("Computing TF-IDF features...")
            
            # Validate input
            spark_service.validate_dataframe(df, ['cleaned_content'])
            
            # Set job group for Spark UI tracking
            spark = spark_service.get_session()
            spark.sparkContext.setJobGroup("tfidf-computation", "TF-IDF Feature Extraction")
            
            # Add preprocessing job visibility
            logger.info("Starting TF-IDF preprocessing job...")
            df.cache()
            input_count = df.count()
            logger.info(f"Cached input documents: {input_count}")
            df.show(5, truncate=False)
            
            # Build pipeline
            pipeline = self.build_tfidf_pipeline()
            
            # Fit pipeline with job visibility
            logger.info("Starting TF-IDF training job...")
            spark.sparkContext.setJobDescription("TF-IDF Training")
            pipeline_model = pipeline.fit(df)
            logger.info("TF-IDF pipeline training completed")
            
            # Transform with job visibility
            logger.info("Starting TF-IDF transformation job...")
            spark.sparkContext.setJobDescription("TF-IDF Transformation")
            features_df = pipeline_model.transform(df)
            
            # Add intermediate operations for job tracking
            spark.sparkContext.setJobDescription("Feature Caching and Statistics")
            features_df.cache()
            feature_count = features_df.count()
            logger.info(f"TF-IDF features generated for {feature_count} documents")
            
            # Show feature statistics
            features_df.select("doc_id", "features").show(5, truncate=False)
            
            # Additional job-creating operations
            logger.info("Computing feature statistics...")
            feature_stats = features_df.agg(
                {"features": "count"}
            ).collect()[0]
            
            distinct_docs = features_df.select("doc_id").distinct().count()
            logger.info(f"Distinct documents with features: {distinct_docs}")
            
            # Cache for performance
            features_df = spark_service.cache_dataframe(
                features_df,
                name="tfidf_features"
            )
            
            # Store pipeline model for future use
            self._pipeline_model = pipeline_model
            
            logger.info(f"TF-IDF features computed: {features_df.count()} documents")
            
            return features_df, pipeline_model
            
        except Exception as e:
            logger.error(f"TF-IDF computation failed: {str(e)}", exc_info=True)
            raise SparkException(
                f"Failed to compute TF-IDF features: {str(e)}",
                details={'error': str(e)}
            )
    
    def process_documents(
        self,
        documents: List[Dict[str, any]]
    ) -> Tuple[DataFrame, PipelineModel]:
        """
        Complete document processing pipeline
        
        Steps:
        1. Create DataFrame from documents
        2. Preprocess text
        3. Compute TF-IDF features
        
        Args:
            documents: List of document dictionaries
        
        Returns:
            Tuple of (DataFrame with features, pipeline model)
        
        Raises:
            DocumentProcessingException: If processing fails
        """
        try:
            logger.info(f"Starting document processing pipeline for {len(documents)} documents")
            
            # Step 1: Create DataFrame
            df = self.create_documents_dataframe(documents)
            
            # Step 2: Preprocess text
            df = self.preprocess_text(df)
            
            # Step 3: Compute TF-IDF features
            features_df, pipeline_model = self.compute_tfidf_features(df)
            
            logger.info("Document processing pipeline completed successfully")
            
            return features_df, pipeline_model
            
        except (SparkException, DocumentProcessingException):
            raise
        except Exception as e:
            logger.error(f"Document processing failed: {str(e)}", exc_info=True)
            raise DocumentProcessingException(
                f"Document processing pipeline failed: {str(e)}",
                details={'error': str(e), 'document_count': len(documents)}
            )


# Export
__all__ = ['DocumentProcessor']
