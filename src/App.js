import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Sonidos
const buttonClick = new Audio("https://cdn.freesound.org/previews/553/553362_11409686-lq.mp3");
const lastSeconds = new Audio("https://cdn.freesound.org/previews/485/485406_6142149-lq.mp3");
const bellSound = new Audio("https://cdn.freesound.org/previews/328/328823_4877562-lq.mp3");
const breakDone = new Audio("https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3");
const sessionDone = new Audio("https://cdn.freesound.org/previews/322/322930_5260872-lq.mp3");
const coolSound = new Audio("https://cdn.freesound.org/previews/619/619834_7614679-lq.mp3");
const coolSound2 = new Audio("https://cdn.freesound.org/previews/619/619837_7614679-lq.mp3");
const popupSound = new Audio("https://cdn.freesound.org/previews/364/364657_6687700-lq.mp3");

// Lista de diálogos
const dialogTextList = [
  {
    type: "skip",
    title: "Skip session?",
    desc: "You are skipping without completing the session.",
  },
  {
    type: "stop",
    title: "Are you sure?",
    desc: "You are in the middle of a focus session, would you like to finish this session?",
  },
  {
    type: "discard",
    title: "Discard changes?",
    desc: "Are you sure you wish to discard the current changes? ",
  }
];

// Componente Dialog
const Dialog = ({ mode, dialogType, handleDialogCallback, handleDialogReturnResult }) => {
  const dialog = dialogTextList.find(dialog => dialog.type === dialogType);

  const handleDialog = (type) => {
    handleDialogCallback(false);
    handleDialogReturnResult(type);
  };

  return (
    <dialog open={mode}>
      <div className="content">
        <h3>{dialog?.title}</h3>
        <p>{dialog?.desc}</p>
        <div className="btn-group">
          <button className="secondary" onClick={() => handleDialog("back")}>back</button>
          <button className="primary" onClick={() => handleDialog(dialog?.type)}>
            {dialog?.type}
          </button>
        </div>
      </div>
    </dialog>
  );
};

// Componente App
const App = () => {
  const [sessionLength, setSessionLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSession, setIsSession] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // Estado para el modo oscuro
  const [isCoverOpen, setIsCoverOpen] = useState(true); // Estado para la portada
  const audioRef = useRef(null);

  // Cargar preferencia de modo oscuro desde localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Aplicar el modo oscuro al body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Solicitar permiso para notificaciones
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("Este navegador no soporta notificaciones.");
    } else if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Notificación cuando el tiempo está a punto de terminar
  useEffect(() => {
    if (timeLeft === 60) {
      showNotification("¡Casi terminamos!", "Queda 1 minuto para completar la sesión.");
    }
  }, [timeLeft]);

  // Notificación cuando cambia de sesión
  useEffect(() => {
    if (timeLeft === 0) {
      const sessionType = isSession ? "Trabajo" : "Descanso";
      showNotification("Cambio de sesión", `¡Comienza la sesión de ${sessionType}!`);
    }
  }, [timeLeft, isSession]);

  const showNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  // Actualizar el tiempo restante cuando cambien las longitudes de sesión o descanso
  useEffect(() => {
    setTimeLeft(isSession ? sessionLength * 60 : breakLength * 60);
  }, [sessionLength, breakLength, isSession]);

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            audioRef.current.play();
            setIsSession((prevSession) => !prevSession);
            playSoundOnSessionEnd(); // Reproducir sonido al finalizar sesión o descanso
            return isSession ? breakLength * 60 : sessionLength * 60;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, isSession, sessionLength, breakLength]);

  const playSoundOnSessionEnd = () => {
    if (isSession) {
      sessionDone.play(); // Sonido al finalizar sesión de trabajo
    } else {
      breakDone.play(); // Sonido al finalizar sesión de descanso
    }
  };

  const handleStartStop = () => {
    setIsRunning((prevRunning) => !prevRunning);
    buttonClick.play(); // Reproducir sonido al iniciar/pausar
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionLength(25);
    setBreakLength(5);
    setTimeLeft(25 * 60);
    setIsSession(true);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    coolSound.play(); // Reproducir sonido al resetear
  };

  const handleDialogCallback = (open, type) => {
    setIsDialogOpen(open);
    setDialogType(type);
  };

  const handleDialogReturnResult = (result) => {
    if (result === "skip") {
      setTimeLeft(0);
      bellSound.play(); // Reproducir sonido al saltar sesión
    } else if (result === "stop") {
      setIsRunning(false);
      breakDone.play(); // Reproducir sonido al detener sesión
    }
    setIsDialogOpen(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Calcular el progreso de la barra
  const totalTime = isSession ? sessionLength * 60 : breakLength * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className={darkMode ? 'dark-mode' : 'light-mode'}>
      <button className="toggle-theme" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
      </button>

      {/* Portada */}
      {isCoverOpen && (
        <div className="cover">
          <h1>25 + 5 Clock</h1>
          <p>Developed by Eddie Jonathan Garcia Borbon</p>
          <button onClick={() => setIsCoverOpen(false)}>Open</button>
        </div>
      )}

      {/* Aplicación principal */}
      {!isCoverOpen && (
        <div className="app">
          <h1>25 + 5 Clock</h1>
          <div className="controls">
            <div className="control">
              <h2 id="break-label" style={{ color: isSession ? '#00ffcc' : '#ff00cc' }}>Break Length</h2>
              <button id="break-decrement" onClick={() => setBreakLength(Math.max(1, breakLength - 1))}>
                -
              </button>
              <span id="break-length" style={{ color: isSession ? '#00ffcc' : '#ff00cc' }}>{breakLength}</span>
              <button id="break-increment" onClick={() => setBreakLength(Math.min(60, breakLength + 1))}>
                +
              </button>
            </div>
            <div className="control">
              <h2 id="session-label" style={{ color: isSession ? '#00ffcc' : '#000' }}>Session Length</h2>
              <button id="session-decrement" onClick={() => setSessionLength(Math.max(1, sessionLength - 1))}>
                -
              </button>
              <span id="session-length" style={{ color: isSession ? '#00ffcc' : '#000' }}>{sessionLength}</span>
              <button id="session-increment" onClick={() => setSessionLength(Math.min(60, sessionLength + 1))}>
                +
              </button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <div className="progress-bar-text">{formatTime(timeLeft)}</div>
          </div>

          <div className="buttons">
            <button id="start_stop" onClick={handleStartStop}>
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button id="reset" onClick={handleReset}>
              Reset
            </button>
          </div>
          <audio id="beep" ref={audioRef} src="/sounds/alarm.mp3" />

          {/* Diálogo */}
          <Dialog
            mode={isDialogOpen}
            dialogType={dialogType}
            handleDialogCallback={handleDialogCallback}
            handleDialogReturnResult={handleDialogReturnResult}
          />
        </div>
      )}
    </div>
  );
};

export default App;