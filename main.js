/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';


// you have to require the utils module and call adapter function
// const utils = require(__dirname + '/lib/utils'); // Get common adapter utils
const utils = require("@iobroker/adapter-core");
const adapter = new utils.Adapter('miio-acpartner');
const dgram = require('dgram');
const MiHome = require(__dirname + '/lib/mihomepacket');
const com = require(__dirname + '/lib/comands');
const server = dgram.createSocket('udp4');


let isConnect = false;
let connected = false;
let commands = {};
let pingInterval;
let paramPingInterval;
let packet;
let firstSet = true;
let air_condition_configuration = undefined;
let power = '';
let led = '';
let target_temperature = '';
let swing_mode = '';
let fan_speed = '';
let mode = '';
let prefix = '';
let suffix = '';

let params = '';
let params_temp = '';

let tt1 = '';
let tt4 = '';
let tt7 = '';



const acpartner =   {

    on_off:     undefined,
    mode:       undefined,
    ws:         undefined,
    swing:      undefined,
    temp:       undefined,
    rc_type:    undefined,
    config:     undefined,
    led:        undefined,
    ac_power:   undefined

};



const last_id = {
    get_model_and_state: 0
};

const reqParams = [
    com.get_model_and_state,
    com.miIOinfo
];

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    if (!state || state.ack) return;

    // Warning, state can be null if it was deleted
    adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));

    // output to parser

    const command = id.split('.').pop();

    if (com[command]) {
        let params = com[command].params || '';
        params = state.val;
        if (command === 'power_state'){
            if (state.val) {params = 'on'}
            else params = 'off';
        };
        sendMsg(com[command], [params], function () {
        adapter.setForeignState(id, state.val, true);
        });

    } else {
        if (command === 'on_off') {
            if (state.val == 'on') {power = '1'} else {power = '0'}

        } else if (command === 'mode') {    // режим
            switch (state.val) {        
                case 'heat':
                    mode = '0';
                    break;
                case 'cool':
                    mode = '1';
                    break;
                case 'auto':
                    mode = '2';
                    break;
                case 'dry':
                    mode = '3';
                    break;
                case 'wind':
                    mode = '4';
                    break;
                default:
                    mode = '2';
                    state.val = 'auto';
                    break;    
            }    

        } else if (command === 'ws') {      // скорость
            switch (state.val) {        
                case 'low':
                    fan_speed = '0';
                    break;
                case 'medium':
                    fan_speed = '1';
                    break;
                case 'high':
                    fan_speed = '2';
                    break;
                case 'auto':
                    fan_speed = '3';
                    break;
                default:
                    fan_speed = '3';
                    state.val = 'auto';
                    break;        
            }  

        } else if (command === 'swing') {   // качание
            switch (state.val) {        
                case 'on':
                    swing_mode = '0';
                    break;
                case 'off':
                    swing_mode = '1';
                    break;
                case 'chigoon':
                    swing_mode = 'C';
                    break;
                case 'chigooff':
                    swing_mode = 'D';
                    break;
                default:
                    swing_mode = '1';
                    state.val = 'off';
                    break;              
            };

        } else if (command === 'temp') {        // температура
            if (state.val <= 16 || state.val >= 30) { state.val = 20 };
            target_temperature = state.val.toString(16);
            tt1 = (1 + state.val - 17).toString(16);
            tt4 = (4 + state.val - 17).toString(16);
            tt7 = (7 + state.val - 17).toString(16);

        } else if (command === 'led') {         // led
            if (state.val == 'on') {led = '0'                      
                } else if (state.val == 'off') {led = 'A';
                } else {led = 'A'}
        } else if (com[command] === undefined) {
            adapter.log.error('Unknown state "' + id + '"');
        } else {
            adapter.log.error('Command "' + command + '" is not configured');
        }

        params_temp = prefix + power + mode + fan_speed + swing_mode + target_temperature; 
        
        switch (prefix) {        
            case '0100010727':  // "deviceType": "gree_2","base": "[po][mo][wi][sw][tt]1100190[tt1]205002102000[tt7]0190[tt1]207002000000[tt4]"
                if (power === '0') { params = prefix + '01011101004000205002112000D04000207002000000A0';    // "off": "01011101004000205002112000D04000207002000000A0"
                } else { params = params_temp + '1100190' + tt1 + '205002102000' + tt7 + '0190' + tt1 + '207002000000' + tt4 + suffix};
                break;
            case '0100004795':  //"deviceType": "gree_8","base": "[po][mo][wi][sw][tt][li]10009090000500"
                params = params_temp + led + '10009090000500' + suffix;      
                break;
            case '0180333331':  // "deviceType": "haier_1", "base": "[po][mo][wi][sw][tt]1"
                params = params_temp + '1' + suffix;
                break;
            case '0180666661':  // "deviceType": "aux_1", "base": "[po][mo][wi][sw][tt]1"
                params = params_temp + '1' + suffix;
                break;
            case '0180777771':  // "deviceType": "chigo_1", "base": "[po][mo][wi][sw][tt]1"
                params = params_temp + '1' + suffix;
                break;
            default:            // "deviceType": "generic", "base": "[po][mo][wi][sw][tt][li]"
                params = params_temp + led + suffix;
                break;              
        };

        sendMsg(com.send_cmd, [params], function () {
        adapter.setForeignState(id, state.val, true);
        });
    }

});

adapter.on('unload', function (callback) {
    if (pingTimeout) clearTimeout(pingTimeout);
    adapter.setState('info.connection', false, true);
    if (pingInterval) clearInterval(pingInterval);
    if (paramPingInterval) clearInterval(paramPingInterval);
    if (typeof callback === 'function') callback();
});


adapter.on('ready', main);

let pingTimeout = null;

function sendPing() {
    pingTimeout = setTimeout(() => {
        pingTimeout = null;
        if (connected) {
            connected = false;
            adapter.log.debug('Disconnect');
            adapter.setState('info.connection', false, true);
        }
    }, 3000);


    try {
        server.send(commands.ping, 0, commands.ping.length, adapter.config.port, adapter.config.ip, function (err) {
            if (err) adapter.log.error('Cannot send ping: ' + err)
        });

    } catch (e) {
        adapter.log.warn('Cannot send ping: ' + e);
        clearTimeout(pingTimeout);
        pingTimeout = null;
        if (connected) {
            connected = false;
            adapter.log.debug('Disconnect');
            adapter.setState('info.connection', false, true);
            }
        }
}


function send(reqParams, cb, i) {
    i = i || 0;
    if (!reqParams || i >= reqParams.length) {
        return cb && cb();
    }

    sendMsg(reqParams[i], null, () => {
        setTimeout(send, 200, reqParams, cb, i + 1);
    });
}

function requestParams() {
    if (connected) {
        adapter.log.debug('requesting params every: ' + adapter.config.paramPingInterval / 1000 + ' Sec');
        send(reqParams, () => {});
    }
}

function sendMsg(method, params, options, callback) {
    // define optional options
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }

    // define default options
    options = options || {};
    if (options.rememberPacket === undefined) {
        options.rememberPacket = true;
    } // remember packets per default

    // remember packet if not explicitly forbidden
    // this is used to route the returned package to the sendTo callback
    if (options.rememberPacket) {
        last_id[method.method] = packet.msgCounter;
        adapter.log.debug('lastid' + JSON.stringify(last_id));
    }

    const message_str = buildMsg(method, params);

    try {
        const cmdraw = packet.getRaw_fast(message_str);

        server.send(cmdraw, 0, cmdraw.length, adapter.config.port, adapter.config.ip, err => {
            if (err) adapter.log.error('Cannot send command: ' + err);
            if (typeof callback === 'function') callback(err);
        });
        adapter.log.debug('sendMsg >>> ' + message_str);
        //adapter.log.debug('sendMsgRaw >>> ' + cmdraw.toString('hex'));
    } catch (err) {
        adapter.log.warn('Cannot send message_: ' + err);
        if (typeof callback === 'function') callback(err);
    }
    packet.msgCounter++;
}

function buildMsg(method, params) {
    const message = {};
    if (method) {
        message.id = packet.msgCounter;
        message.method = method;
        if (!(params === '' || params === undefined || params === null || (params instanceof Array && params.length === 1 && params[0] === ''))) {
            message.params = params;
        }
    } else {
        adapter.log.warn('Could not build message without arguments');
    }
    return JSON.stringify(message).replace('"method":{"', '"').replace(']"}}', ']"}').replace('"},"', '","');
}

function str2hex(str) {
    str = str.replace(/\s/g, '');
    const buf = new Buffer(str.length / 2);
    for (let i = 0; i < str.length / 2; i++) {
        buf[i] = parseInt(str[i * 2] + str[i * 2 + 1], 16);
    }
    return buf;
}

function getStates(message) {
    //Search id in answer
    clearTimeout(pingTimeout);
    pingTimeout = null;
    if (!connected) {
        connected = true;
        adapter.log.debug('Connected');
        adapter.setStateChanged('info.connection', true, true);
    }

    try {
        const answer = JSON.parse(message);
        answer.id = parseInt(answer.id, 10);

        if (answer.id === last_id.get_model_and_state) {

            let model_format =          answer.result[0].slice(1,2);
            let device_type =           answer.result[0].slice(3,4);
            let air_condition_brand =   answer.result[0].slice(4,8);
            let air_condition_remote =  answer.result[0].slice(8,16);
            let state_format =          answer.result[0].slice(-1);





            prefix = answer.result[0].slice(0,2) + answer.result[0].slice(8,16);
            suffix = answer.result[0].slice(-1);
            acpartner.ac_power = parseInt(answer.result[2], 10);
            acpartner.rc_type = answer.result[1].slice(-8);

            adapter.setStateChanged('service_info.rc_type', acpartner.rc_type, true);
            adapter.setStateChanged('service_info.model_format', model_format, true);
            adapter.setStateChanged('service_info.device_type', device_type, true);
            adapter.setStateChanged('service_info.air_condition_brand', air_condition_brand, true);
            adapter.setStateChanged('service_info.state_format', state_format, true);

//=======================================================================
            air_condition_configuration = answer.result[1].slice(2,10);

            if ((air_condition_configuration !== undefined) && (acpartner.config !== air_condition_configuration)) {
                acpartner.config = air_condition_configuration;    

                power =                 answer.result[1].slice(2,3);
                mode =                  answer.result[1].slice(3,4);
                fan_speed =             answer.result[1].slice(4,5);
                swing_mode =            answer.result[1].slice(5,6);
                target_temperature =    answer.result[1].slice(6,8);
                led =                   answer.result[1].slice(8,9);
//=======================================================================
            
                if (power == '1') {acpartner.on_off = 'on'} else {acpartner.on_off = 'off'};

                    switch (mode) {        // режим
                        case '0':
                            acpartner.mode = 'heat';
                            break;
                        case '1':
                            acpartner.mode = 'cool';
                            break;
                        case '2':
                            acpartner.mode = 'auto';
                             break;
                        case '3':
                            acpartner.mode = 'dry';
                            break;
                        case '4':
                            acpartner.mode = 'wind';
                            break;    
                        };

                    switch (fan_speed) {        // скорость
                        case '0':
                            acpartner.ws = 'low';
                            break;
                        case '1':
                            acpartner.ws = 'medium';
                            break;
                        case '2':
                            acpartner.ws = 'high';
                            break;
                        case '3':
                            acpartner.ws = 'auto';
                            break;                
                        };

                    switch (swing_mode) {        // качание
                        case '0':
                            acpartner.swing = 'on';
                            break;
                        case '1':
                            acpartner.swing = 'off';
                            break;
                        case '2':
                            acpartner.swing = 'unknown';
                            break;
                        case '7':
                            acpartner.swing = 'unknown';
                            break;
                        case 'C':
                            acpartner.swing = 'chigoon';
                            break;
                        case 'D':
                            acpartner.swing = 'chigooff';
                            break;          
                        };

            acpartner.temp = parseInt(target_temperature, 16);        // температура

            if (led == '0') {acpartner.led = 'on'                      // led
            } else if (led == 'A') {acpartner.led = 'off'
            } else {acpartner.led = 'unknown'};



            // adapter.setState('control.result2', acpartner.config, true);
            // adapter.setState('control.result4', answer.result[1], true);

            adapter.setState('control.on_off', acpartner.on_off, true);
            adapter.setState('control.mode', acpartner.mode, true);
            adapter.setState('control.ws', acpartner.ws, true);
            adapter.setState('control.swing', acpartner.swing, true);
            adapter.setState('control.temp', acpartner.temp, true);
            adapter.setState('control.led', acpartner.led, true);
        }
            adapter.setState('info.power', acpartner.ac_power, true)


        } else if (answer.id === last_id.send_cmd) {
            if  (answer.error !== undefined) {adapter.log.warn('Command send_cmd failed, err code =' + answer.error.code +')')};
            if (answer.result !== undefined) {adapter.log.debug('Command send_cmd completed successfully')};

        } else if (answer.id === last_id.set_power) {
            if (answer.result[0] === 'ok') {
                adapter.log.debug('Command set_power completed successfully')}
                else {adapter.log.warn('Command set_power failed')}

        } else if (answer.id === last_id['miIO.info']) {
            adapter.setStateChanged('info.device_model', answer.result.model, true);
            adapter.setStateChanged('info.device_fw', answer.result.fw_ver, true);
            adapter.setStateChanged('info.wifi_signal', answer.result.ap.rssi, true)

        } else if (answer.id in sendCommandCallbacks) {

            // invoke the callback from the sendTo handler
            const callback = sendCommandCallbacks[answer.id];
            if (typeof callback === 'function') callback(answer);
        }
    }
    catch (err) {
        adapter.log.debug('The answer from AC Partner is not correct! (' + err + ')');
    }
}


//create default states
/*function init() {

    adapter.setObjectNotExists('control.result2', {
        type: 'state',
        common: {
            name: 'Result 2',
            type: 'string',
            role: 'level',
            read: true,
            write: true,
            unit: '',
            desc: 'RESULT 2'
        },
        native: {}
    });

    adapter.setObjectNotExists('control.result4', {
        type: 'state',
        common: {
            name: 'Result 4',
            type: 'string',
            role: 'level',
            read: true,
            write: true,
            desc: 'RESULT 4'
        },
        native: {}
    });

}*/



function checkSetTimeDiff() {
    const now = Math.round(parseInt((new Date().getTime())) / 1000);//.toString(16)
    const messageTime = parseInt(packet.stamprec.toString('hex'), 16);
    packet.timediff = (messageTime - now) === -1 ? 0 : (messageTime - now); // may be (messageTime < now) ? 0...

    if (firstSet && packet.timediff !== 0) {
        adapter.log.debug('Time difference between AC Partner and ioBroker: ' + packet.timediff + ' sec');
    }

    if (firstSet) {
        firstSet = false;
    }
}

function main() {
    adapter.setState('info.connection', false, true);
    adapter.config.port = parseInt(adapter.config.port, 10) || 54321;
    adapter.config.ownPort = parseInt(adapter.config.ownPort, 10) || 53421;
    adapter.config.pingInterval = parseInt(adapter.config.pingInterval, 10) || 20000;
    adapter.config.paramPingInterval = parseInt(adapter.config.paramPingInterval, 10) || 10000;

    // init();

    // Abfrageintervall mindestens 10 sec.
    if (adapter.config.paramPingInterval < 10000) {
        adapter.config.paramPingInterval = 10000;
    }


    if (!adapter.config.token) {
        adapter.log.error('Token not specified!');
        //return;
    } else {

        packet = new MiHome.Packet(str2hex(adapter.config.token), adapter);

        packet.msgCounter = 1;

        commands = {
            ping: str2hex('21310020ffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        };

        server.on('error', function (err) {
            adapter.log.error('UDP error: ' + err);
            server.close();
            process.exit();
        });


        server.on('message', function (msg, rinfo) {
            if (rinfo.port === adapter.config.port) {
                if (msg.length === 32) {
                    adapter.log.debug('Receive1 <<< Helo <<< ' + msg.toString('hex'));
                    packet.setRaw(msg);
                    isConnect = true;
                    checkSetTimeDiff();

                    clearTimeout(pingTimeout);
                    pingTimeout = null;
                    if (!connected) {
                        connected = true;
                        adapter.log.debug('Connected');
                        adapter.setState('info.connection', true, true);
                        requestParams();
                    }

                } else {

                    //hier die Antwort zum decodieren
                    packet.setRaw(msg);
                    //adapter.log.debug('Receive2 <<< ' + packet.getPlainData() + '<<< ' + msg.toString('hex'));
                    adapter.log.debug('Receive2 <<< ' + packet.getPlainData() + '<<< ');
                    getStates(packet.getPlainData());
                }
            }
        });

        server.on('listening', function () {
            const address = server.address();
            adapter.log.debug('server started on ' + address.address + ':' + address.port);
        });

        try {
            server.bind(adapter.config.ownPort);
        } catch (e) {
            adapter.log.error('Cannot open UDP port: ' + e);
            return;
        }

        sendPing();
        pingInterval = setInterval(sendPing, adapter.config.pingInterval);
        paramPingInterval = setInterval(requestParams, adapter.config.paramPingInterval);

        adapter.subscribeStates('*');


    }

}

const sendCommandCallbacks = {/* "counter": callback() */};


adapter.on('message', function (obj) {
    // responds to the adapter that sent the original message
    function respond(response) {
        if (obj.callback) adapter.sendTo(obj.from, obj.command, response, obj.callback);
    }

    // some predefined responses so we only have to define them once
    const predefinedResponses = {
        ACK: {error: null},
        OK: {error: null, result: 'ok'},
        ERROR_UNKNOWN_COMMAND: {error: 'Unknown command!'},
        MISSING_PARAMETER: paramName => {
            return {error: 'missing parameter "' + paramName + '"!'};
        }
    };

    // handle the message
    if (obj) {
        respond(predefinedResponses.ERROR_UNKNOWN_COMMAND)
    }
});
