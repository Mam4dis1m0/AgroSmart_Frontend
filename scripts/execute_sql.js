import fs from 'fs';
import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

const sqlScript = fs.readFileSync('c:\\Users\\dante\\Desktop\\proyecto web\\html\\agrosmart_db_CORREGIDO.sql', 'utf8');

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }

  console.log('Connected to MySQL');
  
  connection.query(sqlScript, (err, results) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('✅ Database created successfully!');
      console.log('✅ All tables and triggers installed');
    }
    connection.end();
  });
});
