const { type, error } = require("jquery");

const ADDRESS_TABLE_NAME = "Addresses";
const TOWN_TABLE_NAME = "Towns";
const TERRITORY_TABLE_NAME = "Territories";
const STATUS_TABLE_NAME = "Statuses";
const RECORD_TABLE_NAME = "Records";


const CREATE_ADDRESS_TABLE =   
"CREATE TABLE if not exists " + ADDRESS_TABLE_NAME + 
"(AddressId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
"Address VARCHAR(60) NOT NULL, " + 
"Address2 VARCHAR(60), " + 
"unique(AddressId));"


const CREATE_TOWN_TABLE =
"CREATE TABLE if not exists " + TOWN_TABLE_NAME +
"(TownId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
"TownName VARCHAR(60) NOT NULL, "  +
"unique (TownId, TownName));"


const CREATE_TERRITORY_TABLE =
"CREATE TABLE if not exists " + TERRITORY_TABLE_NAME +
"(TerritoryId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
"TerritoryName VARCHAR(60) NOT NULL, " +
"TownId INTEGER, " +
"unique (TerritoryId, TerritoryName));"


const CREATE_STATUS_TABLE = 
"CREATE TABLE if not exists " + STATUS_TABLE_NAME +
"(StatusId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
"StatusName VARCHAR(60) NOT NULL, " +
"Active INTEGER NOT NULL, " +
"unique(StatusId, StatusName));"


const CREATE_RECORD_TABLE = 
"CREATE TABLE if not exists " + RECORD_TABLE_NAME +
"(RecordId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
"AddressId INTEGER NOT NULL, " + 
"TerritoryId INTEGER NOT NULL, " +
"Notes BLOB, " +
"StatusId INTEGER NOT NULL, " +
"DateCreated DATE NOT NULL);"




function GetCurrentRecords(db){
    var query = 
    "SELECT r1.RecordId, " +
    "r1.AddressId, addr.Address, " + 
    "addr.Address2, r1.Notes, " + 
    "sta.StatusId, sta.StatusName, terr.TerritoryId, terr.TerritoryName, " +
    "r1.DateCreated " +
    "FROM " + RECORD_TABLE_NAME + " r1 " +
    "INNER JOIN ( " + 
    "SELECT AddressId,  MAX(DateCreated) as MaxDateCreated " +
    "FROM " + RECORD_TABLE_NAME + " " +
    "GROUP BY AddressId) " +
    "r2 ON r1.AddressId = r2.AddressId AND r1.DateCreated = r2.MaxDateCreated " +
    "INNER JOIN " + ADDRESS_TABLE_NAME + " addr " +
    "ON r1.AddressId = addr.AddressId " +
    "INNER JOIN " + TERRITORY_TABLE_NAME + " terr " +
    "ON r1.TerritoryId  = terr.TerritoryId " +
    "INNER JOIN " + STATUS_TABLE_NAME + " sta " +
    "ON r1.StatusId = sta.StatusId " +
    "ORDER BY terr.TerritoryId"

    var cmd = db.prepare(query)
    var result = cmd.all()
    return result
}

function GetAllTowns(db, callback){
    var query = 
    "SELECT town.TownId, town.TownName " + 
    "FROM " + TOWN_TABLE_NAME + " town "

    db.all(query, (err, rows)=>{
        if(err)
        throw err;
        if(typeof callback == 'function'){
            callback(rows);
        }
    })
}

function GetAllTerritories(db){
    var query = 
    "SELECT terr.TerritoryId, terr.TerritoryName, terr.TownId " +
    "FROM " + TERRITORY_TABLE_NAME + " terr ";

    var cmd = db.prepare(query)
    var result = cmd.all()
    return result
    
}

function GetAllStatuses(db){
    var query = 
    "SELECT sta.StatusId, sta.StatusName, sta.Active " +
    "FROM " + STATUS_TABLE_NAME + " sta ";

    var cmd = db.prepare(query)
    var result = cmd.all()
    return result
}


function AddRecord(db, address_id, territory_id, notes, status_id, date_created){
    var addRecord = 
    "INSERT INTO " + RECORD_TABLE_NAME + "(AddressId, TerritoryId, Notes, StatusId, DateCreated) " +
    "VALUES ( " +
    "?, ?, ?, ?, ?)";

    var cmd = db.prepare(addRecord)
    cmd.run(address_id, territory_id, notes, status_id, date_created)
}


function AddStatus(db, statusName, active){
    var query = 
    "INSERT INTO " + STATUS_TABLE_NAME + " ( " +
    "StatusName, Active) " +
    "VALUES ( " +
    "?, ?)";
    
    var cmd = db.prepare(query)
    var result = cmd.run(statusName, active)
}

function AddAddress(db, address, address2){
    var query = 
    "INSERT INTO " + ADDRESS_TABLE_NAME  + " (Address, Address2) " +
    "VALUES ( " +
    "(?), (?))";

    var cmd = db.prepare(query)
    var result = cmd.run(address, address2)
}

function AddTerritory(db, territoryName, townId=null){
    var query = 
    "INSERT INTO " + TERRITORY_TABLE_NAME + "(TerritoryName, TownId) " +
    "VALUES (" +
    "(?), (?));";

    var cmd = db.prepare(query)
    var result = cmd.run(territoryName, townId)
}


function GetAddressId(db, address, address2){
    var query = 
    "SELECT addr.AddressId " +
    "FROM " + ADDRESS_TABLE_NAME + " addr " +
    "WHERE addr.Address = ? " + 
    "AND addr.Address2 = ?"

    var cmd = db.prepare(query)
    var result = cmd.get(address, address2)
    if(result != undefined){
        return result.AddressId
    }
    return -1
}


function GetRecord(db, record_id){
    var query =
    "SELECT RecordId, AddressId, TerritoryId, Notes, DateCreated " +
    "FROM " + RECORD_TABLE_NAME + " " +
    "WHERE RecordId = ?;"

    var cmd = db.prepare(query)
    var result = cmd.get(record_id)

    return result
}

function GetStatusId(db, status){
    var query = 
    "SELECT sta.StatusId " +
    "FROM " + STATUS_TABLE_NAME + " sta " +
    "WHERE sta.StatusName = ?;";

    var cmd = db.prepare(query)

    var result = cmd.get(status)
    if(result != undefined){
        return result.StatusId
    }
    return -1
}

function GetTerritoryId(db, territory){
    var query = 
    "SELECT terr.TerritoryId " +
    "FROM " + TERRITORY_TABLE_NAME + " terr " +
    "WHERE terr.TerritoryName = ?;";

    var cmd = db.prepare(query)

    var result = cmd.get(territory)
    if(result != undefined){
        return result.TerritoryId
    }
    return -1

}

function DeleteRecord(db, record_id){
    var record = GetRecord(db, record_id)

    var query = 
    "DELETE FROM " + RECORD_TABLE_NAME + " " +
    "WHERE AddressId = ? AND TerritoryId = ?;"
    
    var cmd = db.prepare(query)
    cmd.run([record.AddressId, record.TerritoryId])
}

function UpdateStatus(db, status_id, status_name){
    var query = 
    "UPDATE " + STATUS_TABLE_NAME + " " +
    "SET StatusName = ? " +
    "WHERE StatusId = ?";

    var cmd = db.prepare(query);
    var result = cmd.run(status_name, status_id);
}

function UpdateTerritory(db, territory_id, territory_name){
    var query = 
    "UPDATE " + TERRITORY_TABLE_NAME + " " +
    "SET TerritoryName = ? " +
    "WHERE TerritoryId = ?";

    var cmd = db.prepare(query);
    var result = cmd.run(territory_name, territory_id);
    
}


function ImportExternalDb(external_db, main_db){
    var get_all_records = 
    "SELECT rec.RecordId, rec.AddressId, addr.AddressId, " +
    "addr.Address, addr.Address2, rec.TerritoryId, terr.TerritoryName, " +
    "rec.StatusId, sta.StatusName, rec.DateCreated " +
    "FROM " + RECORD_TABLE_NAME + " rec " +
    "INNER JOIN " + ADDRESS_TABLE_NAME + " addr " +
    "ON rec.AddressId = addr.AddressId " +
    "INNER JOIN " + TERRITORY_TABLE_NAME + " terr " +
    "ON rec.TerritoryId = terr.TerritoryId " +
    "INNER JOIN " + STATUS_TABLE_NAME + " sta " +
    "ON rec.StatusId = sta.StatusId" 
    

    var external_cmd = external_db.prepare(get_all_records)
    var external_rows = external_cmd.all()

    var main_cmd = main_db.prepare(get_all_records)
    var main_rows = main_cmd.all()


    external_rows.forEach((row) => {
        var address_id = GetAddressId(main_db, row['Address'], row['Address2'])
        if(address_id == -1){
            AddAddress(main_db, row['Address'], row['Address2'])
            address_id = GetAddressId(main_db, row['Address'], row['Address2'])
        }

        var territory_id = GetTerritoryId(main_db, row['TerritoryName'])
        if(territory_id == -1){
            AddTerritory(main_db, row['TerritoryName'])
            territory_id = GetTerritoryId(main_db, row['TerritoryName'])
        }

        var status_id = GetStatusId(main_db, row['StatusName'])
        if(status_id == -1){
            AddStatus(main_db, row['StatusName'], 1)
            status_id = GetStatusId(main_db, row['StatusName'])
        }

        if(!hasRecord(main_db, address_id, territory_id, status_id, row['Notes'], row['DateCreated'])){
            AddRecord(main_db, address_id, territory_id, row['Notes'], status_id, row['DateCreated'])
        }
    });



    function hasRecord(db, address_id, territory_id, status_id, notes, date_created){
        var query = 
        "SELECT * " +
        "FROM " + RECORD_TABLE_NAME + " " +
        "WHERE AddressId = ? AND TerritoryId = ? " +
        "AND StatusId = ? AND Notes = ? AND DateCreated = ?"

        var cmd = db.prepare(query)
        var result = cmd.get(address_id, territory_id, status_id, notes, date_created)
        if(result === undefined){
            return false
        }
        return true                
    }

}

exports.initTables = function(db){
    var addr_table = db.prepare(CREATE_ADDRESS_TABLE);
    addr_table.run()

    var town_table = db.prepare(CREATE_TOWN_TABLE);
    town_table.run()

    var terr_table = db.prepare(CREATE_TERRITORY_TABLE);
    terr_table.run()

    var sta_table = db.prepare(CREATE_STATUS_TABLE);
    sta_table.run()

    var rec_table = db.prepare(CREATE_RECORD_TABLE);
    rec_table.run()
};


exports.ADDRESS_TABLE_NAME = ADDRESS_TABLE_NAME;
exports.TOWN_TABLE_NAME = TOWN_TABLE_NAME;
exports.TERRITORY_TABLE_NAME = TERRITORY_TABLE_NAME;
exports.STATUS_TABLE_NAME = STATUS_TABLE_NAME;
exports.RECORD_TABLE_NAME = RECORD_TABLE_NAME;

exports.GetCurrentRecords = GetCurrentRecords;
exports.GetAllTowns = GetAllTowns;
exports.GetAllTerritories = GetAllTerritories;
exports.GetAllStatuses = GetAllStatuses;

exports.GetAddressId = GetAddressId
exports.GetStatusId = GetStatusId
exports.GetTerritoryId = GetTerritoryId


exports.AddRecord = AddRecord;
exports.AddAddress = AddAddress;
exports.AddStatus = AddStatus;
exports.AddTerritory = AddTerritory;

exports.UpdateStatus = UpdateStatus;
exports.UpdateTerritory = UpdateTerritory;

exports.DeleteRecord = DeleteRecord;
exports.ImportExternalDb = ImportExternalDb