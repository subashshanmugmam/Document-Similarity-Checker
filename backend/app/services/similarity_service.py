"""
Similarity Service
Computes document similarity using cosine similarity on TF-IDF features
"""

from typing import List, Dict, Tuple
import numpy as np
from datetime import datetime
import time

from pyspark.sql import DataFrame
from pyspark.sql.functions import col
from pyspark.ml.linalg import Vectors, VectorUDT, DenseVector, SparseVector

from app.services.spark_service import spark_service
from app.core.logging import get_logger
from app.core.exceptions import SparkException, DocumentProcessingException
from app.core.config import settings, AppConstants
from app.utils.helpers import DataFormatter, TimeFormatter
from app.models.schemas import SimilarPair, AnalysisStatistics

logger = get_logger(__name__)


class SimilarityComputer:
    """Compute document similarity using cosine similarity"""
    
    def __init__(self):
        """Initialize similarity computer"""
        self.spark = spark_service.get_session()
    
    @staticmethod
    def vector_to_array(vector) -> np.ndarray:
        """
        Convert Spark ML vector to numpy array
        
        Args:
            vector: Spark ML Vector (Dense or Sparse)
        
        Returns:
            Numpy array
        """
        if isinstance(vector, DenseVector):
            return np.array(vector.toArray())
        elif isinstance(vector, SparseVector):
            return np.array(vector.toArray())
        else:
            raise ValueError(f"Unsupported vector type: {type(vector)}")
    
    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Compute cosine similarity between two vectors
        
        Formula: similarity = (A · B) / (||A|| × ||B||)
        
        Args:
            vec1: First vector
            vec2: Second vector
        
        Returns:
            Similarity score between 0 and 1
        """
        # Compute dot product
        dot_product = np.dot(vec1, vec2)
        
        # Compute norms
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        # Handle zero vectors
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        # Compute cosine similarity
        similarity = dot_product / (norm1 * norm2)
        
        # Ensure result is between 0 and 1
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    
    def compute_pairwise_similarities(
        self,
        features_df: DataFrame,
        threshold: float = 0.7,
        include_all_pairs: bool = True
    ) -> List[Dict[str, any]]:
        """
        Compute pairwise document similarities
        
        Args:
            features_df: DataFrame with 'features' column (TF-IDF vectors)
            threshold: Similarity threshold for flagging
            include_all_pairs: Include all pairs or only those above threshold
        
        Returns:
            List of similarity pairs with scores
        
        Raises:
            SparkException: If computation fails
        """
        try:
            logger.info(f"Computing pairwise similarities (threshold={threshold})...")
            start_time = time.time()
            
            # Validate input
            spark_service.validate_dataframe(
                features_df,
                ['doc_id', 'filename', 'features']
            )
            
            # Set job group for Spark UI tracking
            spark = spark_service.get_session()
            spark.sparkContext.setJobGroup("similarity-computation", "Document Similarity Analysis")
            
            # Add explicit Spark operations to show in UI
            logger.info("Executing Spark DataFrame operations...")
            
            # Cache the dataframe to show storage in Spark UI
            spark.sparkContext.setJobDescription("Caching Feature Vectors")
            features_df.cache()
            
            # Trigger Spark job: Count operation
            spark.sparkContext.setJobDescription("Counting Documents")
            doc_count = features_df.count()
            logger.info(f"Spark job completed: Counted {doc_count} documents")
            
            # Trigger another Spark job: Collect statistics
            spark.sparkContext.setJobDescription("Computing Statistics")
            stats_df = features_df.agg({
                "doc_id": "count",
                "filename": "count"
            }).collect()
            logger.info(f"Spark job completed: Collected statistics")
            
            # Show the dataframe in Spark UI
            spark.sparkContext.setJobDescription("Displaying DataFrame Schema")
            features_df.show(truncate=False)
            
            # Trigger Spark job: Collect documents to driver
            logger.info("Collecting documents from Spark DataFrame...")
            documents = features_df.select(
                'doc_id', 'filename', 'features'
            ).collect()
            logger.info(f"Spark job completed: Collected {len(documents)} documents")
            
            if doc_count < AppConstants.MIN_DOCUMENTS_FOR_ANALYSIS:
                raise DocumentProcessingException(
                    f"Need at least {AppConstants.MIN_DOCUMENTS_FOR_ANALYSIS} documents",
                    details={'document_count': doc_count}
                )
            
            # Convert vectors to numpy arrays
            doc_vectors = [
                (doc['doc_id'], doc['filename'], self.vector_to_array(doc['features']))
                for doc in documents
            ]
            
            # Compute pairwise similarities
            similarities = []
            total_comparisons = 0
            
            for i in range(len(doc_vectors)):
                doc1_id, doc1_name, vec1 = doc_vectors[i]
                
                for j in range(i + 1, len(doc_vectors)):
                    doc2_id, doc2_name, vec2 = doc_vectors[j]
                    
                    # Compute similarity
                    similarity = self.cosine_similarity(vec1, vec2)
                    total_comparisons += 1
                    
                    # Check threshold
                    flagged = similarity >= threshold
                    
                    # Include pair if above threshold or if including all
                    if include_all_pairs or flagged:
                        similarities.append({
                            'doc1_id': doc1_id,
                            'doc1_name': doc1_name,
                            'doc2_id': doc2_id,
                            'doc2_name': doc2_name,
                            'similarity': round(similarity, 4),
                            'flagged': flagged
                        })
            
            # Sort by similarity (descending)
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            
            elapsed_time = time.time() - start_time
            
            logger.info(
                f"Similarity computation completed: "
                f"comparisons={total_comparisons}, "
                f"pairs={len(similarities)}, "
                f"time={TimeFormatter.format_duration(elapsed_time)}"
            )
            
            return similarities
            
        except DocumentProcessingException:
            raise
        except Exception as e:
            logger.error(f"Similarity computation failed: {str(e)}", exc_info=True)
            raise SparkException(
                f"Failed to compute similarities: {str(e)}",
                details={'error': str(e)}
            )
    
    def create_similarity_matrix(
        self,
        features_df: DataFrame
    ) -> Tuple[List[List[float]], List[str]]:
        """
        Create similarity matrix for all documents
        
        Args:
            features_df: DataFrame with features
        
        Returns:
            Tuple of (similarity matrix, document names)
        
        Raises:
            SparkException: If matrix creation fails
        """
        try:
            logger.info("Creating similarity matrix...")
            
            # Add Spark operations for UI visibility
            logger.info("Executing Spark operations for matrix creation...")
            
            # Cache for performance and UI visibility
            features_df.cache()
            
            # Trigger Spark job: Get document count
            doc_count = features_df.count()
            logger.info(f"Spark job: Matrix for {doc_count} documents")
            
            # Trigger Spark job: Get unique documents
            unique_docs = features_df.select("doc_id", "filename").distinct().collect()
            logger.info(f"Spark job: Found {len(unique_docs)} unique documents")
            
            # Show dataframe structure in Spark UI
            features_df.printSchema()
            features_df.show(5, truncate=False)
            
            # Collect all documents for matrix computation
            logger.info("Collecting features for matrix computation...")
            documents = features_df.collect()
            logger.info(f"Spark job completed: Collected {len(documents)} feature vectors")
            
            doc_count = len(documents)
            
            # Extract names and vectors
            doc_names = [doc['filename'] for doc in documents]
            doc_vectors = [
                self.vector_to_array(doc['features'])
                for doc in documents
            ]
            
            # Create matrix
            matrix = []
            for i in range(doc_count):
                row = []
                for j in range(doc_count):
                    if i == j:
                        # Self-similarity is always 1.0
                        similarity = 1.0
                    else:
                        similarity = self.cosine_similarity(
                            doc_vectors[i],
                            doc_vectors[j]
                        )
                    row.append(round(similarity, 4))
                matrix.append(row)
            
            logger.info(f"Similarity matrix created: {doc_count}x{doc_count}")
            
            return matrix, doc_names
            
        except Exception as e:
            logger.error(f"Matrix creation failed: {str(e)}", exc_info=True)
            raise SparkException(
                f"Failed to create similarity matrix: {str(e)}",
                details={'error': str(e)}
            )
    
    def compute_statistics(
        self,
        similarities: List[Dict[str, any]],
        total_documents: int,
        processing_time: float,
        threshold: float
    ) -> AnalysisStatistics:
        """
        Compute analysis statistics
        
        Args:
            similarities: List of similarity pairs
            total_documents: Total number of documents
            processing_time: Processing time in seconds
            threshold: Similarity threshold used
        
        Returns:
            AnalysisStatistics object
        """
        try:
            if not similarities:
                # No similarities found
                return AnalysisStatistics(
                    total_documents=total_documents,
                    total_comparisons=0,
                    flagged_pairs=0,
                    avg_similarity=0.0,
                    max_similarity=0.0,
                    min_similarity=0.0,
                    processing_time=TimeFormatter.format_duration(processing_time)
                )
            
            # Extract similarity scores
            scores = [pair['similarity'] for pair in similarities]
            
            # Count flagged pairs
            flagged_count = sum(1 for pair in similarities if pair['flagged'])
            
            # Calculate statistics
            stats = AnalysisStatistics(
                total_documents=total_documents,
                total_comparisons=len(similarities),
                flagged_pairs=flagged_count,
                avg_similarity=round(np.mean(scores), 4),
                max_similarity=round(np.max(scores), 4),
                min_similarity=round(np.min(scores), 4),
                processing_time=TimeFormatter.format_duration(processing_time)
            )
            
            logger.debug(f"Statistics computed: {stats.dict()}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Statistics computation failed: {str(e)}")
            # Return default statistics on error
            return AnalysisStatistics(
                total_documents=total_documents,
                total_comparisons=len(similarities),
                flagged_pairs=0,
                avg_similarity=0.0,
                max_similarity=0.0,
                min_similarity=0.0,
                processing_time=TimeFormatter.format_duration(processing_time)
            )
    
    def format_similar_pairs(
        self,
        similarities: List[Dict[str, any]]
    ) -> List[SimilarPair]:
        """
        Format similarity pairs as Pydantic models
        
        Args:
            similarities: List of similarity dictionaries
        
        Returns:
            List of SimilarPair models
        """
        pairs = []
        
        for sim in similarities:
            pair = SimilarPair(
                doc1=sim['doc1_name'],
                doc2=sim['doc2_name'],
                doc1_id=sim['doc1_id'],
                doc2_id=sim['doc2_id'],
                similarity=sim['similarity'],
                percentage=DataFormatter.format_percentage(sim['similarity']),
                flagged=sim['flagged']
            )
            pairs.append(pair)
        
        return pairs


# Export
__all__ = ['SimilarityComputer']
