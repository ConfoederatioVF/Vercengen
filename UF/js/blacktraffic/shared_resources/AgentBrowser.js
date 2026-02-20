if (!global.Blacktraffic) global.Blacktraffic = {};

/**
 * <span color = "yellow">{@link ve.Feature}</span>: UF feature used for browser automation, with matching Puppeteer/Selenium distributions. Note that Puppeteer is recommended for most automation use-cases, as it is more effective at spoofing user traffic.
 * 
 * @class
 * @memberof Blacktraffic
 * @namespace Blacktraffic.AgentBrowser
 * @type {Blacktraffic.AgentBrowser}
 */
Blacktraffic.AgentBrowser = class {
	//Declare local static variables
	
	/**
	 * @type Blacktraffic.AgentBrowser[]
	 */
	static instances = [];
	
	constructor (arg0_key, arg1_options) {
		//Convert from parameters
		let key = arg0_key;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		this.key = key;
		this.options = options;
		
		//Push to AgentBrowser instances if possible
		Blacktraffic.AgentBrowser.instances.push(this);
	}
	
	/**
	 * Removes the current AgentBrowser from the super class.
	 * - Method of: {@link Blacktraffic.AgentBrowser}
	 */
	remove () {
		//Iterate over all Blacktraffic.AgentBrowser.instances and remove the current instance
		for (let i = 0; i < Blacktraffic.AgentBrowser.instances.length; i++) {
			let local_browser = Blacktraffic.AgentBrowser.instances[i];
			
			if (local_browser.key === this.key) {
				Blacktraffic.AgentBrowser.instances.splice(i, 1);
				break;
			}
		}
	}
};