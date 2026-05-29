CREATE DATABASE IF NOT EXISTS portfolio_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_ai;

-- tabella degli utenti registrati
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHaaaaAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabella delle opere caricate dagli utenti
CREATE TABLE IF NOT EXISTS works (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  image_path VARCHAR(255) NOT NULL,
  color_palette JSON,           -- colori principali estratti dall'immagine, salvati come array json
  ai_description TEXT,          -- descrizione generata da claude
  ai_tags TEXT,                 -- tag suggeriti dall'ai, separati da virgola
  style_category VARCHAR(50),   -- lo stile dell'opera, es minimalist o brutalist
  tools_used VARCHAR(255),      -- strumenti usati per creare il lavoro, es illustrator o figma
  is_featured TINYINT(1) DEFAULT 0,
  is_public TINYINT(1) DEFAULT 1,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_public (is_public),
  INDEX idx_is_featured (is_featured)
);

-- tabella dei tag che si possono associare alle opere
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6c757d',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- tabella di collegamento tra opere e tag, relazione molti-a-molti
CREATE TABLE IF NOT EXISTS work_tags (
  work_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (work_id, tag_id),
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- tabella delle raccolte 
CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_work_id INT DEFAULT NULL,
  is_public TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cover_work_id) REFERENCES works(id) ON DELETE SET NULL
);

-- tabella di collegamento tra raccolte e opere
CREATE TABLE IF NOT EXISTS collection_works (
  collection_id INT NOT NULL,
  work_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, work_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
);

-- tabella dei commenti sulle opere
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- dati iniziali da inserire quando si crea il db per la prima volta
-- utente admin di default, ricordarsi di cambiare la password prima di andare in produzione!
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@portfolioai.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- tag predefiniti, se ne possono aggiungere altri dall'admin
INSERT INTO tags (name, slug, color) VALUES
('Logo Design', 'logo-design', '#FF6B6B'),
('Typography', 'typography', '#4ECDC4'),
('Branding', 'branding', '#45B7D1'),
('Illustration', 'illustration', '#96CEB4'),
('UI/UX', 'ui-ux', '#FFEAA7'),
('Motion', 'motion', '#DDA0DD'),
('Print', 'print', '#98D8C8'),
('Photography', 'photography', '#F7DC6F'),
('3D', '3d', '#BB8FCE'),
('Web Design', 'web-design', '#85C1E9');
