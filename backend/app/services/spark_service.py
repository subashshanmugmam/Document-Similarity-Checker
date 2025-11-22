"""
Spark Service Module
Manages PySpark session and core Spark operations
"""

from typing import Optional
from pyspark.sql import SparkSession, DataFrame
from pyspark import SparkConf
import atexit

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import SparkException, ConfigurationException

logger = get_logger(__name__)


class SparkService:
    """Singleton Spark session manager"""
    
    _instance: Optional['SparkService'] = None
    _spark: Optional[SparkSession] = None
    
    def __new__(cls):
        """Implement singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Spark service"""
        if self._spark is None:
            self._initialize_spark()
    
    def _initialize_spark(self) -> None:
        """Initialize Spark session with configuration"""
        try:
            logger.info("Initializing Spark session...")
            
            # Set Java options for compatibility with newer Java versions
            import os
            import sys
            java_opts = [
                "--add-opens=java.base/java.lang=ALL-UNNAMED",
                "--add-opens=java.base/java.lang.invoke=ALL-UNNAMED",
                "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED",
                "--add-opens=java.base/java.io=ALL-UNNAMED",
                "--add-opens=java.base/java.net=ALL-UNNAMED",
                "--add-opens=java.base/java.nio=ALL-UNNAMED",
                "--add-opens=java.base/java.util=ALL-UNNAMED",
                "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED",
                "--add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED",
                "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
                "--add-opens=java.base/sun.nio.cs=ALL-UNNAMED",
                "--add-opens=java.base/sun.security.action=ALL-UNNAMED",
                "--add-opens=java.base/sun.util.calendar=ALL-UNNAMED",
            ]
            os.environ["SPARK_SUBMIT_OPTS"] = " ".join(java_opts)
            
            # Set Python executable for PySpark workers
            python_exe = sys.executable
            os.environ["PYSPARK_PYTHON"] = python_exe
            os.environ["PYSPARK_DRIVER_PYTHON"] = python_exe
            logger.info(f"Using Python executable: {python_exe}")
            
            # Configure Spark - simplified for better compatibility
            self._spark = SparkSession.builder \
                .appName(settings.spark_app_name) \
                .master(settings.spark_master) \
                .config("spark.driver.memory", settings.spark_driver_memory) \
                .config("spark.executor.memory", settings.spark_executor_memory) \
                .config("spark.driver.maxResultSize", settings.spark_max_result_size) \
                .config("spark.sql.adaptive.enabled", "true") \
                .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
                .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
                .config("spark.ui.enabled", "true") \
                .config("spark.ui.port", "4040") \
                .config("spark.ui.showConsoleProgress", "true") \
                .config("spark.ui.retainedJobs", "100") \
                .config("spark.ui.retainedStages", "100") \
                .config("spark.ui.retainedTasks", "1000") \
                .config("spark.worker.ui.retainedExecutors", "100") \
                .config("spark.worker.ui.retainedDrivers", "100") \
                .config("spark.sql.ui.retainedExecutions", "100") \
                .config("spark.eventLog.enabled", "false") \
                .config("spark.driver.bindAddress", "127.0.0.1") \
                .config("spark.driver.host", "localhost") \
                .config("spark.driver.extraJavaOptions", " ".join(java_opts)) \
                .config("spark.executor.extraJavaOptions", " ".join(java_opts)) \
                .getOrCreate()
            
            # Set log level
            self._spark.sparkContext.setLogLevel("WARN")
            
            # Register cleanup on exit
            atexit.register(self._cleanup)
            
            # Get Spark UI URL
            spark_ui_url = self._spark.sparkContext.uiWebUrl
            
            logger.info(
                f"Spark session initialized: "
                f"version={self._spark.version}, "
                f"master={settings.spark_master}, "
                f"app_name={settings.spark_app_name}"
            )
            
            if spark_ui_url:
                logger.info(f"Spark Web UI available at: {spark_ui_url}")
            else:
                logger.warning("Spark Web UI URL not available")
            
        except Exception as e:
            logger.error(f"Failed to initialize Spark session: {str(e)}", exc_info=True)
            raise SparkException(
                f"Failed to initialize Spark: {str(e)}",
                details={'error': str(e)}
            )
    
    def get_session(self) -> SparkSession:
        """
        Get Spark session
        
        Returns:
            SparkSession instance
        
        Raises:
            SparkException: If session is not initialized
        """
        if self._spark is None:
            self._initialize_spark()
        
        if self._spark is None:
            raise SparkException("Spark session not initialized")
        
        return self._spark
    
    def is_running(self) -> bool:
        """Check if Spark session is running"""
        try:
            if self._spark is None:
                return False
            
            # Try to access Spark context
            _ = self._spark.sparkContext.appName
            return True
        except Exception:
            return False
    
    def restart_session(self) -> None:
        """Restart Spark session"""
        logger.warning("Restarting Spark session...")
        self.stop_session()
        self._initialize_spark()
    
    def stop_session(self) -> None:
        """Stop Spark session"""
        if self._spark is not None:
            try:
                logger.info("Stopping Spark session...")
                self._spark.stop()
                self._spark = None
                logger.info("Spark session stopped")
            except Exception as e:
                logger.error(f"Error stopping Spark session: {str(e)}")
    
    def _cleanup(self) -> None:
        """Cleanup on exit"""
        self.stop_session()
    
    def get_spark_info(self) -> dict:
        """
        Get Spark session information
        
        Returns:
            Dictionary with Spark info
        """
        if not self.is_running():
            return {
                'status': 'stopped',
                'version': None,
                'master': None,
                'app_name': None
            }
        
        try:
            spark = self.get_session()
            return {
                'status': 'running',
                'version': spark.version,
                'master': spark.sparkContext.master,
                'app_name': spark.sparkContext.appName,
                'default_parallelism': spark.sparkContext.defaultParallelism
            }
        except Exception as e:
            logger.error(f"Error getting Spark info: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def validate_dataframe(self, df: DataFrame, required_columns: list) -> None:
        """
        Validate DataFrame has required columns
        
        Args:
            df: DataFrame to validate
            required_columns: List of required column names
        
        Raises:
            SparkException: If validation fails
        """
        if df is None:
            raise SparkException("DataFrame is None")
        
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            raise SparkException(
                f"DataFrame missing required columns: {missing_columns}",
                details={'missing': list(missing_columns), 'available': df.columns}
            )
    
    def cache_dataframe(self, df: DataFrame, name: str = None) -> DataFrame:
        """
        Cache DataFrame for better performance
        
        Args:
            df: DataFrame to cache
            name: Optional name for the cached DataFrame
        
        Returns:
            Cached DataFrame
        """
        try:
            if name:
                logger.debug(f"Caching DataFrame: {name}")
            
            cached_df = df.cache()
            # Trigger caching by counting
            count = cached_df.count()
            
            if name:
                logger.debug(f"DataFrame cached: {name}, rows={count}")
            
            return cached_df
        except Exception as e:
            logger.warning(f"Failed to cache DataFrame: {str(e)}")
            return df  # Return uncached DataFrame on error
    
    def get_dataframe_info(self, df: DataFrame) -> dict:
        """
        Get DataFrame information
        
        Args:
            df: DataFrame to analyze
        
        Returns:
            Dictionary with DataFrame info
        """
        try:
            return {
                'columns': df.columns,
                'count': df.count(),
                'partitions': df.rdd.getNumPartitions(),
                'schema': str(df.schema)
            }
        except Exception as e:
            logger.error(f"Error getting DataFrame info: {str(e)}")
            return {'error': str(e)}


# Global Spark service instance
spark_service = SparkService()


# Export
__all__ = ['SparkService', 'spark_service']
