const { Client } = require('pg');
const fs = require('fs');

exports.handler = async (event) => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Create tax_payments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.tax_payments (
                tax_payment_id BIGSERIAL PRIMARY KEY,
                tax_type TEXT NOT NULL,
                amount NUMERIC NOT NULL,
                payment_date DATE NOT NULL,
                account_id BIGINT NOT NULL,
                account_name TEXT,
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT fk_tax_payment_account
                    FOREIGN KEY (account_id)
                    REFERENCES public.accounts (account_id)
                    ON DELETE RESTRICT
            );
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tax_payments_tax_type ON public.tax_payments (tax_type);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tax_payments_payment_date ON public.tax_payments (payment_date);
        `);

        console.log('✅ Created tax_payments table');

        // Load seed data - read from event or use inline SQL
        const seedSQL = event.seedSQL || getDefaultSeedSQL();
        
        // Split by semicolons and execute each statement
        const statements = seedSQL.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement.trim() + ';');
                } catch (err) {
                    // Ignore duplicate key errors (data already exists)
                    if (!err.message.includes('duplicate key') && !err.message.includes('already exists')) {
                        console.warn('Statement warning:', err.message);
                    }
                }
            }
        }

        console.log('✅ Seed data loaded');

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Database setup completed successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        await client.end();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function getDefaultSeedSQL() {
    // Return a minimal seed - full seed would be too large for Lambda
    return `
        INSERT INTO accounts (type, account_name, balance, created_at) VALUES
            ('Asset', 'Main Operating Account', 52300.00, now() - interval '65 days'),
            ('Asset', 'Receivables', 18750.00, now() - interval '63 days'),
            ('Liability', 'Accounts Payable', -14200.00, now() - interval '61 days')
        ON CONFLICT DO NOTHING;
    `;
}


