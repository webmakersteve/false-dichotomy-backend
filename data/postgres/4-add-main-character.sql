ALTER TABLE users ADD COLUMN main_character VARCHAR(255) REFERENCES characters(character_id);
