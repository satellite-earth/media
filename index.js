const Torrent = require('@satellite-earth/torrent');


class Media extends Torrent {

	constructor (payload, options = {}) {

		super(payload); // Construct torrent model

		if (typeof this._signed_.name === 'undefined' || this._signed_.name.length === 0) {
			throw Error('Must sign \'name\' when creating media');
		}

		// Torrent 'name' must be prefixed by publisher alias. Since name
		// affects the infoHash, each media file thus hash an unambiguous
		// author. An added benefit is that the publisher name will still
		// be visible even when the data is loaded by an external client.
		if (typeof this.publisher === 'undefined') {
			throw Error('\'name\' must be prefixed by publisher alias');
		}

		// Name of file (not counting prefix) cannot be empty
		if (typeof this.mediaName === 'undefined' || this.mediaName.length === 0) {
			throw Error('\'name\' must include media name after publisher prefix');
		}

		// Truncate notes exceeding max characters
		if (this.notes.length > this.NOTES_MAX_CHARACTERS) {
			this._params_.notes = this.notes.substring(0, this.NOTES_MAX_CHARACTERS);
		}

		// Base URI for media files, falling back to Satellite's media app
		this.mediaEndpoint = options.mediaEndpoint || 'https://satellite.earth/media';

		// Max number of characters to allow in notes
		this.NOTES_MAX_CHARACTERS = options.notesMaxCharacters || 5000;
	}

	// Get publisher alias prefix
	get publisher () {

		if (this.name[0] !== '@') {
			return;
		}

		const _i = this.name.indexOf(' ');
		if (_i === -1) {
			return;
		}

		const s = this.name.substring(0, _i).slice(1);
		if (s.length === 0) {
			return;
		}

		return s;
	}

	// Get name of file excluding publisher prefix
	get mediaName () {

		const _publisher = this.publisher;
		if (typeof _publisher === 'undefined') {
			return;
		}

		return this.name.slice(_publisher.length + 2);
	}

	// Optional notes
	get notes () {

		if (typeof this._params_.notes === 'undefined') {
			return '';
		}

		return this._params_.notes.replace(/↵/g, '\n');
	}

	// Format media as markdown: instead of being embedded
	// in the uri, media notes (if they exist) are placed
	// in the link title in order to improve readability
	get markdown () {

		const _params_ = {};
		for (let key of Object.keys(this._params_)) {
			if (key !== 'notes') {
				_params_[key] = this._params_[key];
			}
		}

		const _model = new Media({ ...this.payload, _params_ });
		const link = `${this.mediaEndpoint}#${_model.uri}`;
		const notes = this.notes.replace(/\n{2,}/g, '↵↵').replace(/\n+/g, '↵').trim();

		return `[${this.name}](${link}${notes ? ' \"' + notes + '\"' : ''})`;
	}
}

module.exports = Media;
