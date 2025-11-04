//Import modules
global.child_process = require("child_process");
global.electron = require("electron");
global.fs = require("fs");
global.path = require("path");

//Initialise functions
{
  function initialiseGlobal () {
    //Declare global variables
    window.main = {
      hierarchies: {}
    };
  }

  function trackPerformance () {
    //Declare local instance variables
    let { ipcRenderer } = require("electron");
		
		let frame_count = 0;
		let last_time = performance.now();

    function trackFPS() {
      frame_count++;
			let now = performance.now();

      //Report back to the main process once per second
      if (now - last_time >= 1000) {
        ipcRenderer.send('update-fps', frame_count);
        frame_count = 0;
        last_time = now;
      }

      //Keep the loop going
      requestAnimationFrame(trackFPS);
    }

    //Start the counter
    trackFPS();
  }
}

//Startup process
{
  ve.start({
    //Accepts wildcards (*), exclusionary patterns (!), and folders/file paths
    load_files: [
      "!core/startup.js",
      "core"
    ],
    special_function: function () {
      initialiseVercengenWindowsDemo();
    }
  });

  initialiseGlobal();
  trackPerformance();
}
