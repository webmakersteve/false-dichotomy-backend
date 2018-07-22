class User {
  constructor(obj) {
    this.id = obj.id;
    this.battletag = obj.battletag;
    this.firstName = obj.firstName;
    this.lastName = obj.lastName;
    this.mainCharacter = obj.mainCharacter;
    this.role = obj.role;
  }
}

User.fromDatabase = function transformRow(row) {
  return new User({
    id: row.bnet_account_id,
    battletag: row.battletag,
    firstName: row.first_name,
    lastName: row.last_name,
    mainCharacter: row.main_character,
    role: row.role || 0,
  });
};

module.exports = User;
