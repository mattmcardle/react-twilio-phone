import React, {useEffect, useState} from "react";

const AudioDeviceSelector = ({device}) => {

  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if(navigator) {
      navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        console.log(stream);
      });
    }
  }, []);

  const scanDevices = () => {
    if (!navigator) {
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      console.log(devices);
      setDevices(devices.filter((device) => device.kind === "audiooutput"));
    });
  };

  const selectAudioOutputDevice = (deviceId) => {
    if (!navigator) {
      return;
    }
    navigator.mediaDevices.selectAudioOutput({deviceId})
    .then(console.log)
    .catch(console.error);
    device.audio.speakerDevices.set(deviceId);
    setDevices([]);
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
    {devices.length === 0 && <button onClick={scanDevices}>Change Output Device</button>}
    
    {devices.length > 0 && devices.map((device, i) => {
      return <p key={i}>{device.label} - {device.kind} <button onClick={() => selectAudioOutputDevice(device.deviceId)}>Use</button></p>
    })}
    </div>
  );
};

export default AudioDeviceSelector;
