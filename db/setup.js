const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('queuewise.db');

// Drop and recreate the users table
db.exec(`DROP TABLE IF EXISTS users;`);
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    id_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    hashedPassword TEXT NOT NULL,
    role TEXT DEFAULT 'patient',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Users table recreated');

// Optional: Insert default admin user
const adminPassword = bcrypt.hashSync('Admin@123', 10);
db.prepare(`
  INSERT INTO users (full_name, id_number, email, phone, hashedPassword, role)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('Clinic Admin', '9999999999999', 'admin@clinic.org', '+27123456789', adminPassword, 'admin'); // Password: Admin@123

console.log('✅ Default admin user added');



db.exec(`
  
CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    saturday_open TEXT,
    saturday_close TEXT
);

INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Rosslyn Clinic', 'Piet Rautenbach St, Rosslyn', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Karenpark Clinic', 'Cnr Heinrich Ave and 1st Avenue, Karenpark', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Doornpoort Clinic', 'Cnr Dr vd Merwe and Cottonwood St, Doornpoort', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('FF Ribeiro Clinic', 'Cnr Madiba and Sisulu St, Pretoria', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Lotus Gardens Clinic', 'Cnr Bergamot and Anthesis St, Lotus Gardens', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Atteridgeville Clinic', 'Ramohoeba Square, Mareka St, Atteridgeville', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Saulsville Clinic', '33 Sekhu St, Saulsville', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Gazankulu Clinic', 'Maunde St, Saulsville', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Phomolong Clinic', 'Cnr 18th and Schurveberg St, Atteridgeville', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Folang Clinic', '157 Es’kia Mphahlele Drive, Pretoria', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Danville Clinic', '10 Trans Oranje Road, Danville', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Hercules Clinic', 'Cnr Taljaard and Ribbon St, Hercules', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Lyttelton Clinic', 'Cnr Basden and Rabie St, Lyttelton, Centurion', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Eldoraigne Clinic', 'Cnr Alan and Saxby Ave, Eldoraigne Centurion', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Rooihuiskraal Clinic', 'Tiptol St, Library Building, Rooihuiskraal, Centurion', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Pierre van Ryneveld Satellite Clinic', 'Fouche St, Library Building, Pierre van Ryneveld, Centurion', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Olievenhoutbosch Clinic', 'Cnr Legong and Rethabile St, Olievenhoutbosch X 13, Centurion', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Laudium Clinic', 'Cnr 6th St and Tangerine Ave, Laudium, Centurion', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('East Lynne Clinic', 'Cnr Meeu and Stegmann St, East Lynne', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Stanza II Bopape Clinic', '25905 Ext 5 Hector Peterson St, Mamelodi West', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Rayton Clinic', 'Rayton, Pretoria', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Nellmapius Clinic', '494 Loeriesfontein Rd, Nellmapius', '07:30', '16:00', '08:00', '13:00');
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Silverton Clinic', 'City Hall, Pretoria Road, Silverton', '07:30', '16:00', NULL, NULL);
INSERT INTO clinics (name, location, open_time, close_time, saturday_open, saturday_close) VALUES ('Pretorius Park Clinic', 'Cnr Beagle and Loristo St, Pretorius Park', '07:30', '16:00', NULL, NULL);

`)




db.close();
console.log('✅ Database connection closed.');
