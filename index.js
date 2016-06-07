var request = require('request-json');
var streamtip_info = require('./streamtip_info.json');
var route_info = require('./route_info.json');

var timeBetweenTriggers = 5000;

if (streamtip_info == null || streamtip_info == undefined)
{
    console.error('Could not load StreamTip credentials.');
    return;
}

if (route_info == null || route_info == undefined)
{
    console.error('Could not load routing info.');
    return;
}

var streamtip_client = request.createClient('https://streamtip.com/api/');
var route_client = request.createClient(route_info.host);

streamtip_client.headers['Authorization'] = streamtip_info.client_id + ' ' + streamtip_info.access_token;

var dateFromTime = new Date();
var dateToTime = null;

var pendingTips = 0;

function checkForNewTips()
{
    dateToTime = new Date();
    streamtip_client.get('tips/?date_from=' + dateFromTime.toISOString() + '&date_to=' + dateToTime.toISOString(), function(err, res, body) {
        
        if (body != undefined && body.hasOwnProperty('_count') && body['_count'] > 0)
        {
            pendingTips += body['_count'];
        }

        if (pendingTips > 0)
        {
            console.log('Found tip.');
            doPendingTips();
        }
        else
        {
            setTimeout(checkForNewTips, 1500);
            console.log('No tips found.');
        }
    });
    dateFromTime = dateToTime;
}

function doPendingTips()
{
    if (pendingTips <= 0)
    {
        pendingTips = 0;
        checkForNewTips();
        return;
    }

    --pendingTips;
    console.log('Shocking.');
    route_client.post(route_info.path, route_info.data, function(err, res, body) {
        console.log(res);
        setTimeout(doPendingTips, timeBetweenTriggers);
    });

}

setTimeout(checkForNewTips, 1500);