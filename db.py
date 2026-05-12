import os

import mysql.connector
from mysql.connector import pooling


_db_pool = None


def _build_config():
    return {
        "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", "root"),
        "database": os.getenv("MYSQL_DATABASE", "club_db"),
        "autocommit": False,
    }


def get_db_connection():
    global _db_pool
    if _db_pool is None:
        _db_pool = pooling.MySQLConnectionPool(
            pool_name="club_pool",
            pool_size=5,
            pool_reset_session=True,
            **_build_config(),
        )
    return _db_pool.get_connection()
