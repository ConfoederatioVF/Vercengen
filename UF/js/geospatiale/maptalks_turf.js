//Initialise functions
{
	if (!global.Geospatiale)
		/**
		 * The namespace for all UF/Geospatiale utility functions, typically for static methods.
		 * 
		 * Regular operations use [Turf.performant](https://github.com/ConfoederatioVF/Turf.performant/), which is a custom fork of Turf.js. It has the same syntax, but features 60-120x the performance (average over union, difference, intersect).
		 * 
		 * See GeoJSON converters (i.e. `convertMaptalksToTurf`, `convertTurfToMaptalks`) for information on its usage. For frontend GIS editing, please review [Naissance HGIS](https://https://github.com/ConfoederatioVF/Naissance).
		 * 
		 * @namespace Geospatiale
		 */
		global.Geospatiale = {};
	
	/**
	 * Cleans rings within a GeoJSON FeatureCollection/MultiPolygon/Polygon to ensure Turf.js validity.
	 *
	 * @param {Object} arg0_geojson_feature
	 *
	 * @returns {Object|null}
	 */
	Geospatiale.cleanRings = function (arg0_geojson_feature) {
		//Convert from parameters
		let geojson_feature = arg0_geojson_feature;
		
		if (!geojson_feature) return null; //Internal guard clause if geojson_feature isn't defined
		
		//Handle Polygon cleaning
		if (geojson_feature.type === "Polygon") {
			let valid_rings = [];
			
			//Iterate over all geojson_feature.coordinates (rings)
			for (let i = 0; i < geojson_feature.coordinates.length; i++) {
				let clean_ring = [];
				let local_ring = geojson_feature.coordinates[i];
				
				//Deduplicate points to calculate true topological length
				if (local_ring) {
					//Iterate over all coords in local_ring
					for (let x = 0; x < local_ring.length; x++) {
						let point_a = local_ring[x];
						let point_b = clean_ring[clean_ring.length - 1];
						
						let is_duplicate = (point_b) ?
							point_a[0] === point_b[0] && point_a[1] === point_b[1] : false;
						
						if (!is_duplicate) clean_ring.push(point_a);
					}
				}
				
				//Auto-close ring if 3 or more unique vertices exist
				if (clean_ring.length >= 3) {
					let first_pt = clean_ring[0];
					let last_pt = clean_ring[clean_ring.length - 1];
					if (first_pt[0] !== last_pt[0] || first_pt[1] !== last_pt[1])
						clean_ring.push([first_pt[0], first_pt[1]]);
				}
				
				if (clean_ring.length >= 4) {
					valid_rings.push(clean_ring);
				} else {
					//Return statement
					if (i === 0) return null;
				}
			}
			geojson_feature.coordinates = valid_rings;
			
			//Return statement
			return (geojson_feature.coordinates.length > 0) ? geojson_feature : null;
		}
		//Handle MultiPolygon cleaning
		else if (geojson_feature.type === "MultiPolygon") {
			let valid_polygons = [];
			
			//Iterate over all geojson_feature.coordinates (rings)
			for (let i = 0; i < geojson_feature.coordinates.length; i++) {
				let is_poly_valid = true;
				let local_polygon = geojson_feature.coordinates[i];
				let valid_rings = [];
				
				//Iterate over all rings in local_polygon
				for (let x = 0; x < local_polygon.length; x++) {
					let local_ring = local_polygon[x];
					let clean_ring = [];
					
					if (local_ring)
						//Iterate over all coords in local_ring
						for (let y = 0; y < local_ring.length; y++) {
							let point_a = local_ring[y];
							let point_b = clean_ring[clean_ring.length - 1];
							
							let is_duplicate = (point_b) ?
								(point_a[0] === point_b[0] && point_a[1] === point_b[1]) : false;
							
							if (!is_duplicate) clean_ring.push(point_a);
						}
					
					//Auto-close ring if 3 or more unique vertices exist
					if (clean_ring.length >= 3) {
						let first_pt = clean_ring[0];
						let last_pt = clean_ring[clean_ring.length - 1];
						if (first_pt[0] !== last_pt[0] || first_pt[1] !== last_pt[1])
							clean_ring.push([first_pt[0], first_pt[1]]);
					}
					
					if (clean_ring.length >= 4) {
						valid_rings.push(clean_ring);
					} else {
						if (x === 0) {
							is_poly_valid = false;
							break;
						}
					}
				}
				
				if (is_poly_valid && valid_rings.length > 0) {
					valid_polygons.push(valid_rings);
				}
			}
			geojson_feature.coordinates = valid_polygons;
			
			//Return statement
			return (geojson_feature.coordinates.length > 0) ? geojson_feature : null;
		}
		//Recursive check for GeometryCollections
		else if (geojson_feature.type === "GeometryCollection") {
			let valid_geometries = [];
			
			//Iterate over all geojson_feature.geometries and recursively process them
			for (let i = 0; i < geojson_feature.geometries.length; i++) {
				let cleaned_sub_geom = Geospatiale.cleanRings(geojson_feature.geometries[i]);
				if (cleaned_sub_geom) valid_geometries.push(cleaned_sub_geom);
			}
			geojson_feature.geometries = valid_geometries;
			
			//Return statement
			return (geojson_feature.geometries.length) > 0 ? geojson_feature : null;
		}
		
		//Return statement
		return geojson_feature;
	};
	
	/**
	 * Converts a {@link maptalks.Geometry} into a {@link turf.Geometry}.
	 *
	 * @param {maptalks.Geometry} arg0_geometry
	 *
	 * @returns {Object|turf.Feature|null}
	 */
	Geospatiale.convertMaptalksToTurf = function (arg0_geometry) {
		//Convert from parameters
		let geometry = arg0_geometry;
		
		if (!geometry) return null;
		
		//Unwrap maptalks serialized JSON if wrapped in .feature
		if (geometry.feature) geometry = geometry.feature;
		
		//Internal guard clause if already a Turf Feature
		if (geometry.type === "Feature" && geometry.geometry) {
			let clean_geom = Geospatiale.cleanRings(geometry.geometry);
			return (clean_geom) ? turf.feature(clean_geom, geometry.properties || {}) : null;
		}
		
		//If raw GeoJSON geometry (Polygon, MultiPolygon, etc.)
		if (geometry.type && geometry.coordinates) {
			let clean_geom = Geospatiale.cleanRings(geometry);
			return (clean_geom) ? turf.feature(clean_geom) : null;
		}
		
		try {
			if (typeof geometry === "object" && typeof geometry.toGeoJSON !== "function") {
				if (typeof maptalks !== "undefined" && maptalks.Geometry) {
					let temp_geometry = (maptalks.GeoJSON) ? maptalks.GeoJSON.toGeometry(geometry) : null;
					geometry = (temp_geometry === null) ? maptalks.Geometry.fromJSON(geometry) : temp_geometry;
				}
			}
			
			if (geometry && typeof geometry.toGeoJSON === "function") {
				let geojson = geometry.toGeoJSON();
				let geometry_data = geojson.geometry ? geojson.geometry : geojson;
				let final_geometry = Geospatiale.cleanRings(geometry_data);
				return (final_geometry) ? turf.feature(final_geometry) : null;
			}
		} catch (e) {
			console.error("[Geospatiale] convertMaptalksToTurf error:", e);
		}
		
		//Return statement
		return (typeof geometry === "object" && geometry !== null && geometry.type && Array.isArray(geometry.coordinates)) ? geometry : null;
	};
	
	/**
	 * Converts a {@link turf.Geometry} into a {@link maptalks.Geometry}
	 * 
	 * @param {turf.Geometry} arg0_geometry
	 * 
	 * @returns {maptalks.Geometry|maptalks.GeometryCollection}
	 */
	Geospatiale.convertTurfToMaptalks = function (arg0_geometry) {
		let geometry = arg0_geometry;
		
		if (geometry === null || geometry === undefined) return null;
		
		//Internal guard clause if the geometry is already a live Maptalks geometry
		if (typeof geometry.toJSON === "function" && typeof geometry.getType === "function")
			return geometry;
		
		if (typeof maptalks === "undefined") return geometry;
		
		//Handle Turf Feature or raw geometry
		let feature = geometry;
		if (geometry.feature) feature = geometry.feature;
		if (feature.type !== "Feature")
			feature = { type: "Feature", geometry: feature, properties: {} };
		
		//Convert using Maptalks built-in
		let result = (maptalks.GeoJSON) ? maptalks.GeoJSON.toGeometry(feature) : null;
		if (!result && maptalks.Geometry?.fromJSON)
			result = maptalks.Geometry.fromJSON(feature);
		
		//Return statement; handle array results (MultiPolygon becomes array in some maptalks versions)
		if (Array.isArray(result)) {
			if (typeof maptalks.MultiPolygon === "function")
				return new maptalks.MultiPolygon(result.map(p => p.getCoordinates()));
			return new maptalks.GeometryCollection(result);
		}
		return result;
	};
	
	/**
	 * Returns the coords/geometry format the variable represents.
	 * 
	 * @param {*} arg0_format - The coords/geometry format to input.
	 *
	 * @returns {String} - Either 'geojson_coords'/'geojson_geometry'/'leaflet_coords'/'leaflet_geometry'/'maptalks_coords'/'maptalks_geometry'/'naissance_coords'/'naissance_geometry'/'turf_coords'/'turf_geometry'.
	 */
	Geospatiale.getCoordsType = function (arg0_format) {
		//Convert from parameters
		let format = arg0_format;
		
		//Guard clause if format does not exist
		if (!format)
			return undefined;
		
		if (format.feature) format = format.feature;
		
		//Check if type is 'turf_geometry'
		if (typeof format.toJSON !== "function" && (format.type || format.coordinates || format.geometries)) { //GeoJSON cannot have live functions bound to it
			return "turf_geometry";
		} else {
			return "maptalks_geometry";
		}
	};
	
	/**
	 * Whether the coords type being tested are loosely GeoJSON compatible.
	 * 
	 * @param {*} arg0_coords
	 *
	 * @returns {boolean}
	 */
	Geospatiale.isGeoJSONCoords = function (arg0_coords) {
		//Convert from parameters
		let coords = arg0_coords;
		
		//Internal guard clauses to ensure compatibility
		if (!Array.isArray(coords)) return;
		if (!Array.isArray(coords[0])) return;
		
		//Return statement
		return coords.every(Geospatiale.isGeoJSONCoords);
	};
	
	/**
	 * Performs a component-wise polygon difference operation. For MultiPolygons,
	 * disjoint components outside the subtractor bounding box are passed through
	 * by reference, strictly bounding memory and execution to intersecting parts.
	 *
	 * @param {Object} arg0_target_turf - Target polygon/multipolygon GeoJSON.
	 * @param {Object} arg1_subtractor_turf - Subtractor polygon/multipolygon GeoJSON.
	 *
	 * @returns {Object|null}
	 */
	Geospatiale.diffComponentWise = function (arg0_target_turf, arg1_subtractor_turf) {
		//Convert from parameters
		let target_turf = arg0_target_turf;
		let subtractor_turf = arg1_subtractor_turf;
		
		//Guard clauses
		if (!target_turf) return null;
		if (!subtractor_turf) return target_turf;
		
		//Declare local instance variables
		let clean_sub = Geospatiale.cleanRings(subtractor_turf) || subtractor_turf;
		let sub_bbox = turf.bbox(clean_sub);
		let target_type = target_turf.geometry?.type || target_turf.type;
		
		//Function body
		if (target_type === "MultiPolygon") {
			let coords = target_turf.geometry ? target_turf.geometry.coordinates : target_turf.coordinates;
			let retained_polygons = [];
			
			for (let i = 0; i < coords.length; i++) {
				let ring = coords[i]?.[0];
				if (!ring || ring.length < 4) continue;
				let p_min_x = Infinity, p_min_y = Infinity, p_max_x = -Infinity, p_max_y = -Infinity;
				for (let v = 0; v < ring.length; v++) {
					let pt = ring[v];
					if (pt[0] < p_min_x) p_min_x = pt[0];
					if (pt[0] > p_max_x) p_max_x = pt[0];
					if (pt[1] < p_min_y) p_min_y = pt[1];
					if (pt[1] > p_max_y) p_max_y = pt[1];
				}
				
				let overlaps = !(
					p_min_x > sub_bbox[2] || p_max_x < sub_bbox[0] ||
					p_min_y > sub_bbox[3] || p_max_y < sub_bbox[1]
				);
				
				if (!overlaps) {
					retained_polygons.push(coords[i]);
				} else {
					let poly_feature = turf.polygon(coords[i]);
					let diff_result = null;
					try {
						let clean_poly = Geospatiale.cleanRings(poly_feature) || poly_feature;
						diff_result = turf.difference(turf.featureCollection([clean_poly, clean_sub]));
					} catch (diff_err) {}
					
					if (diff_result) {
						let res_type = diff_result.geometry?.type || diff_result.type;
						let res_coords = diff_result.geometry ? diff_result.geometry.coordinates : diff_result.coordinates;
						
						if (res_type === "Polygon") {
							retained_polygons.push(res_coords);
						} else if (res_type === "MultiPolygon") {
							for (let x = 0; x < res_coords.length; x++)
								retained_polygons.push(res_coords[x]);
						}
					}
				}
			}
			
			if (retained_polygons.length === 0) return null;
			if (retained_polygons.length === 1) return turf.polygon(retained_polygons[0]);
			
			//Return statement
			return turf.multiPolygon(retained_polygons);
		}
		
		//Single polygon handling
		try {
			let clean_target = Geospatiale.cleanRings(target_turf) || target_turf;
			let target_bbox = turf.bbox(clean_target);
			let overlaps = !(
				target_bbox[0] > sub_bbox[2] || target_bbox[2] < sub_bbox[0] ||
				target_bbox[1] > sub_bbox[3] || target_bbox[3] < sub_bbox[1]
			);
			if (!overlaps) return clean_target;
			
			//Return statement
			return turf.difference(turf.featureCollection([clean_target, clean_sub]));
		} catch (e) {
			//Return statement
			return target_turf;
		}
	};
	
	/**
	 * Performs a component-wise polygon union operation. If the added polygon
	 * is disjoint from all existing components, it is appended without full sweep-line clipping.
	 * If it intersects one or more components, only the intersecting components are unioned.
	 *
	 * @param {Object} arg0_target_turf - Target polygon/multipolygon GeoJSON.
	 * @param {Object} arg1_added_turf - Added polygon/multipolygon GeoJSON.
	 *
	 * @returns {Object}
	 */
	Geospatiale.unionComponentWise = function (arg0_target_turf, arg1_added_turf) {
		//Convert from parameters
		let target_turf = arg0_target_turf;
		let added_turf = arg1_added_turf;
		
		//Guard clauses
		if (!target_turf && !added_turf) return null;
		if (!target_turf) return added_turf;
		if (!added_turf) return target_turf;
		
		//Declare local instance variables
		let add_bbox = turf.bbox(added_turf);
		let clean_add = Geospatiale.cleanRings(added_turf) || added_turf;
		let target_type = target_turf.geometry?.type || target_turf.type;
		
		//Function body
		if (target_type === "MultiPolygon") {
			let coords = target_turf.geometry ? target_turf.geometry.coordinates : target_turf.coordinates;
			let intersecting_polygons = [];
			let retained_polygons = [];
			
			for (let i = 0; i < coords.length; i++) {
				let ring = coords[i]?.[0];
				if (!ring || ring.length < 4) continue;
				let p_min_x = Infinity, p_min_y = Infinity, p_max_x = -Infinity, p_max_y = -Infinity;
				for (let v = 0; v < ring.length; v++) {
					let pt = ring[v];
					if (pt[0] < p_min_x) p_min_x = pt[0];
					if (pt[0] > p_max_x) p_max_x = pt[0];
					if (pt[1] < p_min_y) p_min_y = pt[1];
					if (pt[1] > p_max_y) p_max_y = pt[1];
				}
				
				let overlaps = !(
					p_min_x > add_bbox[2] || p_max_x < add_bbox[0] ||
					p_min_y > add_bbox[3] || p_max_y < add_bbox[1]
				);
				
				if (!overlaps) {
					retained_polygons.push(coords[i]);
				} else {
					intersecting_polygons.push(turf.polygon(coords[i]));
				}
			}
			
			//If completely disjoint from all components, simply append as new component
			if (intersecting_polygons.length === 0) {
				let add_type = clean_add.geometry?.type || clean_add.type;
				let add_coords = clean_add.geometry ? clean_add.geometry.coordinates : clean_add.coordinates;
				
				if (add_type === "Polygon") {
					retained_polygons.push(add_coords);
				} else if (add_type === "MultiPolygon") {
					for (let x = 0; x < add_coords.length; x++)
						retained_polygons.push(add_coords[x]);
				}
				
				//Return statement
				return turf.multiPolygon(retained_polygons);
			}
			
			//Only union the intersecting components with the added polygon
			let active_union = clean_add;
			for (let i = 0; i < intersecting_polygons.length; i++) {
				try {
					let u = turf.union(turf.featureCollection([active_union, intersecting_polygons[i]]));
					if (u) active_union = u;
				} catch (union_err) {}
			}
			
			let union_type = active_union.geometry?.type || active_union.type;
			let union_coords = active_union.geometry ? active_union.geometry.coordinates : active_union.coordinates;
			
			if (union_type === "Polygon") {
				retained_polygons.push(union_coords);
			} else if (union_type === "MultiPolygon") {
				for (let x = 0; x < union_coords.length; x++)
					retained_polygons.push(union_coords[x]);
			}
			
			if (retained_polygons.length === 1) return turf.polygon(retained_polygons[0]);
			
			//Return statement
			return turf.multiPolygon(retained_polygons);
		}
		
		//Single polygon handling
		try {
			let clean_target = Geospatiale.cleanRings(target_turf) || target_turf;
			let target_bbox = turf.bbox(clean_target);
			let overlaps = !(
				target_bbox[0] > add_bbox[2] || target_bbox[2] < add_bbox[0] ||
				target_bbox[1] > add_bbox[3] || target_bbox[3] < add_bbox[1]
			);
			if (!overlaps) {
				let target_coords = clean_target.geometry ? clean_target.geometry.coordinates : clean_target.coordinates;
				let add_coords = clean_add.geometry ? clean_add.geometry.coordinates : clean_add.coordinates;
				return turf.multiPolygon([target_coords, add_coords]);
			}
			
			//Return statement
			return turf.union(turf.featureCollection([clean_target, clean_add]));
		} catch (e) {
			//Return statement
			return target_turf;
		}
	};
}