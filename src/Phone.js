import React, { useState, useEffect } from "react";
import { Device } from "twilio-client";
import Dialler from "./Dialler";
import KeypadButton from "./KeypadButton";
import Incoming from "./Incoming";
import OnCall from "./OnCall";
import "./Phone.css";
import states from "./states";
import FakeState from "./FakeState";
import AudioDeviceSelector from "./DeviceSelector";
import { format, formatDuration, duration } from "date-fns";

const STATUSES = {
  ATTEMPTED: 'attempted',
  CONNECTED: 'connected',
  FAILED: 'failed',
  REJECTED: 'rejected',
}

const Phone = ({ token }) => {
  const [state, setState] = useState(states.CONNECTING);
  const [number, setNumber] = useState("");
  const [conn, setConn] = useState(null);
  const [device, setDevice] = useState(null);

  const [callLog, setCallLog] = useState([]);

  useEffect(() => {
    const device = new Device();

    device.setup(token, { debug: false });

    device.on("ready", () => {
      setDevice(device);
      setState(states.READY);
    });
    device.on("connect", connection => {
      updateConnected(parseInt(connection.customParameters.get('attemptId'), 10), connection.parameters.CallSid);
      console.log("Connect event", connection);
      setConn(connection);
      setState(states.ON_CALL);
    });
    device.on("disconnect", (connection) => {
      console.log("Disconnect event", connection);
      setCallDuration(connection.parameters.CallSid);
      setState(states.READY);
      setConn(null);
    });
    device.on("incoming", connection => {
      console.log('incoming', {connection});
      setState(states.INCOMING);
      setConn(connection);
      createCallLog(connection.parameters.From, 'in', STATUSES.CONNECTED, connection.parameters.CallSid);
      connection.on("reject", () => {
        console.log('rejected', connection);
        updateCallLog(connection.parameters.CallSid, STATUSES.REJECTED);
        setState(states.READY);
        setConn(null);
      });
    });
    device.on("cancel", (call) => {
      console.log('cancelled', call)
      setState(states.READY);
      setConn(null);
    });
    device.on("reject", (call) => {
      console.log('rejected', call);
      setState(states.READY);
      setConn(null);
    });

    return () => {
      device.destroy();
      setDevice(null);
      setState(states.OFFLINE);
    };
  }, [token]);

  const handleCall = async () => {
    const attemptId = Date.now();
    const call = await device.connect({ To: number, attemptId });
    console.log("Call", call.parameters.CallSid);
    createCallLog(number, 'out', STATUSES.ATTEMPTED, attemptId);
  };

  const handleHangup = () => {
    device.disconnectAll();
  };

  const createCallLog = (number, direction, status, id) => {
    console.log('creating call log', {number, direction, status, id});
    setCallLog(cl => {
      return [...cl, { number, direction, status, id, time: Date.now(), duration: null }]
    });
  }

  const updateCallLog = (id, status) => {
    setCallLog(cl => {
      console.log('updating', id, status, cl);
      return cl.map(call => {
        if (call.id === id) {
          call.status = status;
        }
        return call;
      });
    })
  };
  const updateConnected = (id, newId) => {
    setCallLog(cl => {
      console.log('updating', id, newId, cl);
      return cl.map(call => {
        if (call.id === id) {
          call.status = STATUSES.CONNECTED;
          call.id = newId;
        }
        return call;
      });
    })
  };

  const setCallDuration = (id) => {
    setCallLog(cl => {
      return cl.map(call => {
        if (call.id === id) {
          call.duration = (Date.now() - call.time) / 1000;
        }
        return call;
      })
    });
  }
  useEffect(() => {
    if (callLog.length === 0) return;
    localStorage.setItem('callLog', JSON.stringify(callLog))
    console.log('set in ls', callLog);
  }, [callLog]);
  useEffect(() => {
    const cl = localStorage.getItem('callLog');
    if (cl) {
      setCallLog(JSON.parse(cl));
    }
  }, []);

  let render;
  if (conn) {
    if (state === states.INCOMING) {
      render = <Incoming device={device} connection={conn}></Incoming>;
    } else if (state === states.ON_CALL) {
      render = <OnCall handleHangup={handleHangup} connection={conn}></OnCall>;
    }
  } else {
    render = (
      <>
        <Dialler number={number} setNumber={setNumber}></Dialler>
        <div className="call">
          <KeypadButton handleClick={handleCall} color="green">
            Call
          </KeypadButton>
        </div>
      </>
    );
  }
  return (
    <div class="phone">
      <FakeState
        currentState={state}
        setState={setState}
        setConn={setConn}
      ></FakeState>
      <div className="state-device">
      <AudioDeviceSelector device={device}></AudioDeviceSelector>
      <p className="status">{state}</p>
      </div>
      <div className="main-wrapper">
      <div className="controls">
        {render}
      </div>
      <div className="call-log">
        <h2>Call Log</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Number</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {callLog && callLog.sort(({time: a}, {time: b}) => b-a).map(call => {
              return (
                <tr key={call.id}>
                  <td>{format(call.time, 'do MMM HH:mm')}</td>
                  <td>{call.number}</td>
                  <td>{call.direction}</td>
                  <td>{call.status}</td>
                  <td>{formatDuration({seconds: call.duration})}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Phone;
