//const { data, trim } = require('jquery');

var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;
const {dialog} = require('electron').remote


var $ = jQuery = require( 'jquery' );
var dt = require( 'datatables.net-bs4' )();
require('popper.js');
require('bootstrap');


let jszip = require('jszip');

var buttons = require( 'datatables.net-buttons-bs4' )();
require('datatables.net-buttons/js/buttons.flash');
require('datatables.net-buttons/js/buttons.html5')(window, $, jszip, pdfMake);
require('datatables.net-buttons/js/buttons.print');
require('datatables.net-buttons/js/buttons.colVis');


var pdfMake = require('pdfmake/build/pdfmake.js');
var pdfFonts = require('pdfmake/build/vfs_fonts');
const { ipcMain } = require('electron');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

var primaryTable;

// $(document).ready(()=>{
//     ipcRenderer.send('record-edit-reload-statuses', rows)
// })


ipcRenderer.send('is-registered', false)


ipcRenderer.on("is-registered", (event, args)=>{
    if(args){
        $('#login-container').show()
        $('#login-password-text').focus()
    }else{
        $('#register-container').show()
        $('#register-password-text').focus()
    }
})

ipcRenderer.on('user-registered', (event, args)=>{
    $('#register-container').hide()
    $('#dnc-table-container').show('fast').promise().done(()=>{
        ipcRenderer.send('request-dnc-table', true)
    })
    initTable()
})

ipcRenderer.on('user-login', (event, args)=>{
    $('#login-container').hide()
    $('#dnc-table-container').show('fast').promise().done(()=>{
        ipcRenderer.send('request-dnc-table', true)
    })
    initTable()
})

function initTable(){
    primaryTable = $('#dnc-table').DataTable({
        dom:'<"html5buttons"B>lTfgitp',
        buttons:[
            {
                extend:'pdf',
                text: 'Export to PDF',
                exportOptions:{
                    columns: ':not(.hidden-record)'
                }
            },
            {
                extend:'excel',
                text: 'Export to Excel',
                exportOptions:{
                    columns: ':not(.hidden-record)'
                }
            }
        ],
        columnDefs:[{
            'defaultContent':' ',
            'targets': '_all',
        },
        {
            'targets':[0],
            "visible": false,
            "searchable": false,
            "paging": false
        },
        {
            'targets':[3],
            "visible": false,
            "searchable": false,
            "paging":false
        },
        {
            'targets':[6],
            "visible": false,
            "searchable": false,
            "paging": false
        }],
        scrollY: "420px",
        scrollCollapse: true,
        paging: false

    });

    primaryTable.buttons().container()
    .appendTo('#dnc-table_wrapper .col-md-6:eq(0)');
}



ipcRenderer.on('load-dnc-table', (event, args)=>{
    
    primaryTable.clear();

    args.forEach((row)=>{
        var date_obj = new Date(row["DateCreated"])
        var hours = date_obj.getHours()
        var mid = 'AM'
        if(hours == 0){
            hours = 12
        }else if(hours > 12){
            hours = hours % 12
            mid = 'PM'
        }
        var data = (date_obj.getMonth() + 1) + '/' + date_obj.getDate() + '/' + date_obj.getFullYear();
        var time = hours + ":" + (date_obj.getMinutes() < 10 ? '0': '') + date_obj.getMinutes() + " " + mid
        
        primaryTable.row.add([
            row["RecordId"],
            row["Address"],
            row["Address2"],
            row["TerritoryId"],
            row["TerritoryName"],
            row["Notes"],
            row["StatusId"],
            row["StatusName"],
            (data)
        ])
    })
    primaryTable.draw();

    ipcRenderer.send('record-edit-reload-territories')
    ipcRenderer.send('record-edit-reload-statuses')
    

})

ipcRenderer.on('record-edit-reload-territories', (event, args)=>{

    $('#record-edit-territory').find('option').remove()
    $('#record-edit-territory').val('')
    $('#record-edit-territory').append(new Option('', ''))
    args.forEach((row)=>{
        $('#record-edit-territory').append(new Option(row["TerritoryName"], row["TerritoryId"]))
    })
})

ipcRenderer.on('record-edit-reload-statuses', (event, args)=>{
    $('#record-edit-status').find('option').remove()
    $('#record-edit-status').val('')
    $('#record-edit-status').append(new Option('', ''))
    args.forEach((row)=>{
        $('#record-edit-status').append(new Option(row["StatusName"], row["StatusId"]))
    })
})

ipcRenderer.on('alert', (event, args)=>{
    alert(args)
})


$('#register-btn').click(()=>{
    ipcRenderer.send('register-user', $('#register-password-text').val())
})


$('#login-btn').click(()=>{
    ipcRenderer.send('login', $('#login-password-text').val())
});


$('#minimize-button').click(() =>{
    var window = remote.getCurrentWindow();
    window.minimize()
});

$('#close-button').click(()=>{
    var window = remote.getCurrentWindow();
    window.close()
});



//record edit container
//==============================================================
$('#add-edit-record').click(()=>{
    clearEdit();
    $("#dnc-table-container").hide();
    $("#record-edit-container").show('fast');

})

$('#record-edit-back').click(()=>{
    $("#record-edit-container").hide()
    $("#dnc-table-container").show("fast");

    
    $('#record-edit-territory').prop('disabled', false)
    $('#record-edit-add-territory').prop('disabled', false)
    
    $('#record-edit-delete').hide()
    
    clearEdit();
    reset_territory_display()
    reset_status_display()
})

$('#record-edit-submit').click(()=>{
    var success = true
    if($('#record-edit-address').val().trim() == '' || $('#record-edit-address').val().trim().length > 60){
        success = false
        $('#record-edit-address-error').css("di splay", "block")
    }else{
        $('#record-edit-address-error').css("display", "none")
    }

    if($('#record-edit-territory').val() === '' && $('#record-edit-territory-new').val() == ''){
        success = false
        $('#record-edit-territory-error').css("display", "block")
    }else{
        $('#record-edit-territory-error').css("display", "none")
    }

    if($('#record-edit-status').val() === '' && $('#record-edit-status-new').val() == ''){
        success = false
        $('#record-edit-status-error').css("display", "block")
    }else{
        $('#record-edit-status-error').css("display", "none")
    }

    if(success){
        
        $("#record-edit-container").toggle();
        $("#dnc-table-container").toggle("fast").promise().done(()=>{
            addOrUpdateRecord()

            clearEdit();
            reset_territory_display()
            reset_status_display()

            $('#record-edit-territory').prop('disabled', false)
            $('#record-edit-add-territory').prop('disabled', false)
            $('#record-edit-delete').hide()
            
        });

    }
})

// record_edit_add_territory_mode
var reatm = 0
var last_territory  = ''
$('#record-edit-add-territory').click(()=>{
    var reat = $('#record-edit-add-territory')
    if(reatm == 0){
        $('#record-edit-territory').toggle()
        $('#record-edit-territory-new').toggle('fast')
        last_territory = $('#record-edit-territory').val()
        $('#record-edit-territory').val('')
        reat.empty()
        reat.append('Select from list')
        reatm = 1
    }else{
        $('#record-edit-territory').toggle('fast')
        $('#record-edit-territory-new').toggle()
        $('#record-edit-territory').val(last_territory)
        last_territory = ''
        reat.empty()
        reat.append('<span class="oi oi-plus"></span> Add territory')
        reatm = 0
    }
})


function reset_territory_display(){
    var reat = $('#record-edit-add-territory')
    if(reatm == 1){
        $('#record-edit-territory').toggle()
        $('#record-edit-territory-new').toggle()
        reat.empty()
        reat.append('<span class="oi oi-plus"></span> Add territory')
        reatm = 0
    }
}

// record_edit_add_status_mode
var reasm = 0
var last_status = ''
$('#record-edit-add-status').click(()=>{
    var reas = $('#record-edit-add-status')
    if(reasm == 0){
        $('#record-edit-status').toggle()
        $('#record-edit-status-new').toggle('fast')
        last_status = $('#record-edit-status').val()
        $('#record-edit-status').val('')
        reas.empty()
        reas.append('Select from list')
        reasm = 1
    }else{
        $('#record-edit-status-new').toggle()
        $('#record-edit-status').toggle('fast')
        $('#record-edit-status').val(last_status)
        last_status = ''
        reas.empty()
        reas.append('<span class="oi oi-plus"></span> Add status')
        reasm = 0
    }
})

function reset_status_display(){
    var reas = $('#record-edit-add-status')
    if(reasm == 1){
        $('#record-edit-status-new').toggle()
        $('#record-edit-status').toggle()
        reas.empty()
        reas.append('<span class="oi oi-plus"></span> Add status')
        reasm = 0
    }
}


//delete button
$('#record-edit-delete').click(()=>{


    $("#record-edit-container").toggle();
    $("#dnc-table-container").toggle("fast").promise().done(()=>{
        var id = $('#record-edit-id').val()
        clearEdit();
        reset_territory_display()
        reset_status_display()

        $('#record-edit-territory').prop('disabled', false)
        $('#record-edit-add-territory').prop('disabled', false)
        $('#record-edit-delete').hide()

        ipcRenderer.send('delete-record', id)
    })
})



//selector for edit tables
$('#dnc-table').on('click', 'tbody td', function() {
    var rowData = primaryTable.row(this).data();
    setRecordEdit(rowData[0], rowData[1], rowData[2], rowData[3], rowData[5], rowData[6])
    $("#dnc-table-container").toggle();
    $("#record-edit-container").toggle("fast");

    if($("#record-edit-id").val != ''){
        $('#record-edit-territory').prop('disabled', true)
        $('#record-edit-add-territory').prop('disabled', true)
        $('#record-edit-delete').toggle()
    }
  })

  
$('#import-records').click(()=>{
    ipcRenderer.send('import-db')
})

$('#export-records').click(()=>{
    ipcRenderer.send('export-db')
})

$('#menu-records').click(()=>{
    $('#dnc-table-container').hide()
    $("#options-menu-container").show('fast')
})


//===============================================================


//options menu=====================================
$('#options-menu-clear-password').click(()=>{
    ipcRenderer.send('delete-password')
})

$('#options-menu-clear-database').click(()=>{
    ipcRenderer.send('delete-database')
})


$('#options-menu-back').click(()=>{
    $('#options-menu-container').hide()
    $('#dnc-table-container').show('fast')
})
//=================================================


$(document).on('keypress', (e)=>{
    if(e.which == 13){
        if($('#login-container').is(':visible')){
            $('#login-btn').trigger('click')
        }
        if($('#register-container').is(':visible')){
            $('#register-btn').trigger('click')
        }
    }
})


function addOrUpdateRecord(){
    var today = new Date();    
    var data = 
    {
        "RecordId": $('#record-edit-id').val().trim(),
        "Address": $('#record-edit-address').val().trim(),
        "Address2": $('#record-edit-address2').val().trim(),
        "TerritoryId": $('#record-edit-territory').val(),
        "TerritoryName": $('#record-edit-territory-new').val(),
        "StatusId": $('#record-edit-status').val(),
        "StatusName": $('#record-edit-status-new').val(),
        "Notes": $('#record-edit-notes').val().trim(),
        "DateCreated": today.toString()
    }

    ipcRenderer.send('add-record', data)

}


function clearEdit(){
    $('#record-edit-id').val('')
    $('#record-edit-address').val('')
    $('#record-edit-address2').val('')

    $('#record-edit-town').val('')

    $('#record-edit-territory option[selected]').attr('selected',)

    $('#record-edit-status option[selected]').attr('selected', false)

    $('#record-edit-notes').val('')

    $('#record-edit-territory-new').val('')
    
    $('#record-edit-status-new').val('')


    last_status = ''
    last_territory = ''



    $('#record-edit-address-error').css("display", "none")
    $('#record-edit-town-error').css("display", "none")
    $('#record-edit-territory-error').css("display", "none")
    $('#record-edit-status-error').css("display", "none")
}


function setRecordEdit(record_id, address, address2, territory, notes, status){
    $('#record-edit-id').val(record_id)

    $('#record-edit-address').val(address)

    $('#record-edit-address2').val(address2)

    $("#record-edit-territory").val(territory)

    $('#record-edit-notes').val(notes)

    $("#record-edit-status").val(status)
}