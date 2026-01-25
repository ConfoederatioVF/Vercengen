//Initialise methods
{
	/**
	 * Clears all nodes.
	 */
	ve.NodeEditor.prototype.clear = function () {
		//Declare local instance variables
		if (this.node_layer) this.node_layer.clear();
		
		for (let i = this.main.nodes.length - 1; i >= 0; i--)
			this.main.nodes[i].remove();
		
		this.main.nodes = [];
		this.main.user.selected_nodes = [];
		this.main.variables = {};
	};
	
	ve.NodeEditor.prototype.getCanvas = function () {
		if (!this._canvas) this._canvas = document.createElement("canvas");
		return this._canvas;
	};
	
	ve.NodeEditor.prototype.getDefaultBaseLayer = function () {
		let base_layer = new maptalks.TileLayer("base", {
			urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
			subdomains: ["a", "b", "c"],
			repeatWorld: true,
		});
		
		base_layer.getBase64Image = (arg0_image) => {
			let img = arg0_image;
			let canvas = this.getCanvas();
			canvas.height = img.height;
			canvas.width = img.width;
			let ctx = canvas.getContext("2d");
			
			if (this.options.bg_ctx) {
				ctx = this.options.bg_ctx(ctx);
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
				ctx.fillStyle = `rgba(25, 25, 25, 1)`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.save();
				ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
				ctx.lineWidth = 1;
				
				let columns = 8;
				let rows = 8;
				let cell_height = canvas.height / rows;
				let cell_width = canvas.width / columns;
				
				for (let i = 0; i <= columns; i++) {
					let local_x = i * cell_width;
					ctx.beginPath();
					ctx.moveTo(local_x, 0);
					ctx.lineTo(local_x, canvas.height);
					ctx.stroke();
				}
				
				for (let i = 0; i <= rows; i++) {
					let local_y = i * cell_height;
					ctx.beginPath();
					ctx.moveTo(0, local_y);
					ctx.lineTo(canvas.width, local_y);
					ctx.stroke();
				}
				ctx.restore();
			}
			
			return canvas.toDataURL("image/jpg", 0.7);
		};
		
		base_layer.getTileUrl = function (x, y, z) {
			return maptalks.TileLayer.prototype.getTileUrl.call(this, x, y, z);
		};
		
		base_layer.on("renderercreate", (e) => {
			e.renderer.loadTileImage = (arg0_image, arg1_url) => {
				let img = arg0_image;
				let url = arg1_url;
				let remote_image = new Image();
				remote_image.crossOrigin = "anonymous";
				remote_image.onload = () =>
					(img.src = base_layer.getBase64Image(remote_image));
				remote_image.src = url;
			};
		});
		
		return base_layer;
	};
}