from app import app, db
from sqlalchemy import text

def add_plaid_metadata_column():
    with app.app_context():
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE bank_info ADD COLUMN IF NOT EXISTS plaid_metadata TEXT'))
            conn.commit()
            print("Added plaid_metadata column to bank_info table")

if __name__ == "__main__":
    add_plaid_metadata_column()
