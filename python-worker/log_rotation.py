"""
Log Rotation Configuration for Python Worker

P1-30: Add log rotation configuration
- Max log size: 10MB
- Retention: 7 days
- Compression for old logs
- Automatic rotation on size/time
"""

import logging
import os
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from pathlib import Path
from datetime import datetime, timedelta
import gzip
import shutil

# ===========================================
# LOG CONFIGURATION
# ===========================================

LOG_CONFIG = {
    # File settings
    'log_dir': '/app/logs',
    'log_filename': 'worker.log',
    'max_bytes': 10 * 1024 * 1024,  # 10MB
    'backup_count': 7,  # Keep 7 days of logs
    
    # Rotation settings
    'rotation_interval': 'midnight',  # Rotate at midnight
    'compression': True,
    'compression_delay': 1,  # Compress after 1 day
    
    # Format settings
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'date_format': '%Y-%m-%d %H:%M:%S',
    
    # Level settings
    'default_level': logging.INFO,
    'console_level': logging.INFO,
    'file_level': logging.DEBUG,
}

# ===========================================
# LOG ROTATION HANDLERS
# ===========================================

class CompressedRotatingFileHandler(RotatingFileHandler):
    """
    Rotating file handler with gzip compression for old logs
    """
    
    def __init__(self, filename, maxBytes=0, backupCount=0, encoding=None, delay=False, compress=True):
        super().__init__(filename, maxBytes, backupCount, encoding, delay)
        self.compress = compress
        self.compressed_files = []
    
    def doRollover(self):
        """
        Perform rollover with optional compression
        """
        super().doRollover()
        
        if self.compress:
            # Compress the oldest backup
            self._compress_oldest_backup()
    
    def _compress_oldest_backup(self):
        """
        Compress the oldest log backup file
        """
        # Find the oldest backup file
        backup_files = sorted([
            f for f in os.listdir(os.path.dirname(self.baseFilename))
            if f.startswith(os.path.basename(self.baseFilename) + '.')
            and not f.endswith('.gz')
        ])
        
        if backup_files:
            oldest_file = backup_files[0]
            file_path = os.path.join(os.path.dirname(self.baseFilename), oldest_file)
            
            try:
                # Compress the file
                compressed_path = file_path + '.gz'
                with open(file_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                # Remove uncompressed file
                os.remove(file_path)
                
                # Track compressed files
                self.compressed_files.append(compressed_path)
                
                # Delete old compressed files beyond retention
                self._cleanup_old_compressed_files()
                
            except Exception as e:
                print(f"Error compressing log file: {e}")
    
    def _cleanup_old_compressed_files(self):
        """
        Remove compressed files older than retention period
        """
        cutoff_date = datetime.now() - timedelta(days=LOG_CONFIG['backup_count'])
        
        for compressed_file in self.compressed_files[:]:
            try:
                file_mtime = datetime.fromtimestamp(os.path.getmtime(compressed_file))
                if file_mtime < cutoff_date:
                    os.remove(compressed_file)
                    self.compressed_files.remove(compressed_file)
            except Exception as e:
                print(f"Error cleaning up old log file: {e}")


class DailyCompressedTimedRotatingFileHandler(TimedRotatingFileHandler):
    """
    Time-based rotating file handler with compression
    Rotates at midnight and compresses old logs
    """
    
    def __init__(self, filename, when='midnight', interval=1, backupCount=7, 
                 encoding=None, delay=False, utc=False, atTime=None, 
                 errors=None, compress=True):
        super().__init__(filename, when, interval, backupCount, encoding, 
                        delay, utc, atTime, errors)
        self.compress = compress
        self.compressed_files = []
    
    def doRollover(self):
        """
        Perform rollover with compression
        """
        super().doRollover()
        
        if self.compress:
            # Compress the previous day's log
            self._compress_previous_log()
    
    def _compress_previous_log(self):
        """
        Compress the previous log file
        """
        # Get the filename that was just rotated
        df = datetime.fromtimestamp(self.rolloverAt - self.interval)
        sfn = self.baseFilename + "." + df.strftime(self.suffix)
        
        if os.path.exists(sfn) and not sfn.endswith('.gz'):
            try:
                compressed_path = sfn + '.gz'
                with open(sfn, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                os.remove(sfn)
                self.compressed_files.append(compressed_path)
                
            except Exception as e:
                print(f"Error compressing log file: {e}")


# ===========================================
# LOGGER SETUP
# ===========================================

def setup_logger(name: str = 'worker', config: dict = None) -> logging.Logger:
    """
    Set up logger with rotation and compression
    
    Args:
        name: Logger name
        config: Optional configuration override
    
    Returns:
        Configured logger instance
    """
    cfg = {**LOG_CONFIG, **(config or {})}
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(cfg['default_level'])
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create log directory
    log_dir = Path(cfg['log_dir'])
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(cfg['console_level'])
    console_format = logging.Formatter(cfg['format'], cfg['date_format'])
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler with rotation
    log_file = log_dir / cfg['log_filename']
    file_handler = CompressedRotatingFileHandler(
        filename=str(log_file),
        maxBytes=cfg['max_bytes'],
        backupCount=cfg['backup_count'],
        compress=cfg['compression'],
    )
    file_handler.setLevel(cfg['file_level'])
    file_handler.setFormatter(console_format)
    logger.addHandler(file_handler)
    
    # Add daily rotating handler as well
    daily_handler = DailyCompressedTimedRotatingFileHandler(
        filename=str(log_file),
        when='midnight',
        interval=1,
        backupCount=cfg['backup_count'],
        compress=cfg['compression'],
    )
    daily_handler.setLevel(cfg['file_level'])
    daily_handler.setFormatter(console_format)
    logger.addHandler(daily_handler)
    
    return logger


# ===========================================
# LOG CLEANUP UTILITIES
# ===========================================

def cleanup_old_logs(log_dir: str = None, retention_days: int = None) -> int:
    """
    Manually clean up old log files
    
    Args:
        log_dir: Log directory path
        retention_days: Number of days to retain
    
    Returns:
        Number of files deleted
    """
    cfg = LOG_CONFIG
    log_dir = log_dir or cfg['log_dir']
    retention_days = retention_days or cfg['backup_count']
    
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    deleted_count = 0
    
    try:
        for filename in os.listdir(log_dir):
            file_path = os.path.join(log_dir, filename)
            
            # Skip if not a log file
            if not (filename.startswith('worker.log') or filename.endswi
