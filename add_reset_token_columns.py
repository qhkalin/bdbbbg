
from app import app, db
from sqlalchemy import text

def add_reset_token_columns():
    with app.app_context():
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100)'))
            conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP'))
            conn.commit()
            print("Added reset token columns to user table")

if __name__ == "__main__":
    add_reset_token_columns()
