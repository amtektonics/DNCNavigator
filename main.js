const { app, BrowserWindow, webContents, dialog } = require('electron')
const {ipcMain} = require('electron');

var fs = require('fs');
var crypto = require('crypto');
const { memory } = require('console');

var Database = require('better-sqlite3')

var repo = require('./DNCRepository');
const { data } = require('jquery');


var password_file = 'passwd.bin'
var data_file = "DNCRecords.db"
var secrect = "SuL5hZxQJCBx2j8d"


var win


function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 900,
    height: 800,
    frame: false,
    icon: `${__dirname}/icon.ico`,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile(`${__dirname}/index.html`)

  // Open the DevTools.
  // win.webContents.openDevTools()

}

app.whenReady().then(createWindow)


//render events
ipcMain.on('is-registered', (event, args)=>{
    fs.access(password_file, (err)=>{
        if(!err){
            event.reply('is-registered', true)
        }
        else{
        event.reply('is-registered', false)
        }
    })
    
})

ipcMain.on('register-user', (event, args)=>{
    const hash = crypto.createHmac('sha256', secrect)
                    .update(args)
                    .digest('hex');
    fs.writeFile(password_file, hash, (err) =>{
        if(err){
            console.log(err);
            app.quit();
        }else{
            var db = Database(data_file);
            repo.initTables(db)
            db.close()
            event.reply('user-registered', true)
            return
        }
    })
})

ipcMain.on('login', (event, args)=>{
    const hash = crypto.createHmac('sha256', secrect)
                    .update(args)
                    .digest('hex')

    fs.readFile(password_file, "utf8", (err, data) =>{
        if(!err){
            if(data === hash){
              var db = Database(data_file);
                repo.initTables(db)
                db.close()
                event.reply('user-login', true)
                return
            }
        }
        app.exit()
    })
});

ipcMain.on('request-dnc-table', (event, args)=>{
  var db = Database(data_file);
  var result = repo.GetCurrentRecords(db);
  db.close()
  event.reply('load-dnc-table', result)
});



ipcMain.on('record-edit-reload-territories', (event, args)=>{
  var db = Database(data_file);
  var data = repo.GetAllTerritories(db)
  db.close()
  event.reply('record-edit-reload-territories', data)
})

ipcMain.on('record-edit-reload-statuses', (event, args)=>{
  var db = Database(data_file);
  var statuses = repo.GetAllStatuses(db)
  db.close()
  event.reply('record-edit-reload-statuses', statuses)
})

ipcMain.on('add-record', (event, args)=>{
  var db = Database(data_file);
  var territory_id = 0
  var status_id = 0
  var address_id = 0

  if(args['TerritoryId'] == ''){
    var terr_name = args['TerritoryName']
    repo.AddTerritory(db, terr_name, -1)
    territory_id = repo.GetTerritoryId(db, terr_name)
  }else{
    territory_id = args['TerritoryId']
  }


  if(args['StatusId'] == ''){
    var sta_name = args['StatusName']
    repo.AddStatus(db, sta_name, 1)
    status_id = repo.GetStatusId(db, sta_name)
  }else{
    status_id = args['StatusId']
  }

  
  
  address_id = repo.GetAddressId(db, args['Address'], args['Address2'])
  if(address_id == -1){
    repo.AddAddress(db, args["Address"], args["Address2"])
    address_id = repo.GetAddressId(db, args['Address'], args['Address2'])
  }

  repo.AddRecord(db, address_id, territory_id, args["Notes"], status_id, args["DateCreated"])

  var rows = repo.GetCurrentRecords(db)
  db.close()
  event.reply('load-dnc-table', rows)
})


ipcMain.on('add-status', (event, args)=>{
  var db = Database(data_file);

  repo.AddStatus(db, args['name'], 1);
  
  var data = repo.GetAllStatuses(db);
    
  var records = repo.GetCurrentRecords(db);

  db.close();

  event.reply('record-edit-reload-statuses', data);

  event.reply('load-dnc-table', records);
})

ipcMain.on('add-territory', (event, args)=>{
  var db = Database(data_file);

  repo.AddTerritory(db, args["name"], -1);
  
  var data = repo.GetAllTerritories(db);
    
  var records = repo.GetCurrentRecords(db);

  db.close();

  event.reply('record-edit-reload-territories', data);

  event.reply('load-dnc-table', records);
})

ipcMain.on('update-status', (event, args)=>{
  var db = Database(data_file);
  repo.UpdateStatus(db, args["id"], args["name"]);

  var data = repo.GetAllStatuses(db);
  
  var records = repo.GetCurrentRecords(db);
  
  db.close();
  
  event.reply('record-edit-reload-statuses', data);
  
  event.reply('load-dnc-table', records);
})

ipcMain.on('update-territory', (event, args)=>{
  var db = Database(data_file);
  repo.UpdateTerritory(db, args["id"], args["name"]);

  var data = repo.GetAllTerritories(db);
    
  var records = repo.GetCurrentRecords(db);
  
  db.close();
  
  event.reply('record-edit-reload-territories', data);

  event.reply('load-dnc-table', records);
})


ipcMain.on('delete-record', (event, args)=>{
  var db = Database(data_file);
  repo.DeleteRecord(db, args)
 
  var rows = repo.GetCurrentRecords(db)
  db.close()
  event.reply('load-dnc-table', rows)
})

ipcMain.on('export-db', (event,args)=>{
  var new_path = dialog.showSaveDialogSync(win, {
    title:'Export Database',
    filters:[
      {name: 'Database', extensions:['db']}
    ]
  })
  if(new_path === undefined){
    event.reply('alert', "Failed to export file")
    return
  }

  var data = fs.readFileSync(data_file)
  fs.writeFileSync(new_path, data)
})


ipcMain.on('import-db', (event, args)=>{
  var new_path = dialog.showOpenDialogSync(win, {
    title: "Import Database",
    multiSelections: false,
    filters:[
      {name:'Database', extensions:['db']}
    ]
  })
    if(new_path === undefined){
      event.reply('alert', "Failed to import file")
      return
    }
  var ext_db = Database(new_path[0])
  var main_db = Database(data_file)
  repo.ImportExternalDb(ext_db, main_db)

  var rows = repo.GetCurrentRecords(main_db)
  ext_db.close()
  main_db.close()
  event.reply('load-dnc-table', rows)
})


ipcMain.on('delete-password', (event, args)=>{
  fs.unlinkSync(password_file)
  win.reload()
})


ipcMain.on('delete-database', (event, args)=>{
  fs.unlinkSync(data_file)
  win.reload()
})


//app events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})