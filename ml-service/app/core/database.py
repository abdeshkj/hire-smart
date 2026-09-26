import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from app.core.config import settings
from app.utils.logger import logger

_db_pool = None

def init_db_pool():
    """Initialize psycopg2 ThreadedConnectionPool."""
    global _db_pool
    if _db_pool is None:
        try:
            logger.info("Initializing PostgreSQL connection pool...")
            _db_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=settings.DATABASE_URL
            )
            logger.info("PostgreSQL connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            raise e
    return _db_pool

def close_db_pool():
    """Close all connections in the pool."""
    global _db_pool
    if _db_pool is not None:
        logger.info("Closing database connection pool...")
        _db_pool.closeall()
        _db_pool = None
        logger.info("Database connection pool closed.")

@contextmanager
def get_db_connection():
    """Context manager to borrow a connection from the pool and return it."""
    global _db_pool
    if _db_pool is None:
        init_db_pool()
        
    conn = _db_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        _db_pool.putconn(conn)
