const LOG_DURATION = 1500;

// log style
document.head.insertAdjacentHTML('beforeend', `
<style>
  .log-message {
    opacity: 1;
    transition: opacity 0.5s ease-in-out;
  }
  .log-message.fade-out {
    opacity: 0;
  }
</style>
`);

// Create a log container
const logContainer = document.createElement('div');

logContainer.classList.add('fixed', 'bottom-24', 'right-0', 'flex', 'flex-col-reverse', 'gap-2', 'p-4');
document.body.appendChild(logContainer);

// Function to display a success log
function logSuccess(message) {
  const logElement = createLogElement(message, 'bg-aetina');
  logContainer.appendChild(logElement);
  console.log(message);
  fadeOutAndRemove(logElement);
}

// Function to display an error log
function logError(message) {
  const logElement = createLogElement(message, 'bg-red-500/70');
  logContainer.appendChild(logElement);
  console.error(message);
  fadeOutAndRemove(logElement);
}

// Function to display a warning log
function logWarning(message) {
  const logElement = createLogElement(message, 'bg-yellow-500/70');
  logContainer.appendChild(logElement);
  console.warn(message);
  fadeOutAndRemove(logElement);
}

// Helper function to create a log element
function createLogElement(message, bgColorClass) {
  const logElement = document.createElement('div');
  logElement.classList.add(bgColorClass, 'text-white', 'px-4', 'py-2', 'rounded', 'flex', 'flex-row', 'log-message');
  logElement.textContent = message;
  return logElement;
}

// Helper function to fade out and remove log element
function fadeOutAndRemove(logElement) {
  setTimeout(() => {
    logElement.classList.add('fade-out');
    setTimeout(() => {
      logElement.remove();
    }, 500); // Match this time with the CSS transition duration
  }, LOG_DURATION); // Adjust this delay to control how long the log message is visible before fading out
}