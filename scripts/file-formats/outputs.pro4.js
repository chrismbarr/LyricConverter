/* global parser */
/*!
 * LICENSE:
 * CC BY-NC-SA 3.0
 * This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US
 */

/*=====================================================
 * OUTPUT for converting to ProPresenter 4 format
=======================================================*/

(function() {
    var THIS_OUTPUT = 'pro4';
    var FILE_EXTENSION = "." + THIS_OUTPUT;

    //Extend the outputs object on the parser to allow for HTML output
    parser.outputs[THIS_OUTPUT] = function(songList) {

        //Loop through and convert each file and add the 
        var convertedFileContents = [];
        var errorFiles = [];
        $.each(songList, function(i, song) {
            try {
                convertedFileContents.push({
                    name: song.name,
                    data: _makeProPresenterFile(song.data)
                });
            } catch (ex) {
                errorFiles.push(song.name);
            }
        });

        //Display any errors if we have them
        if (errorFiles.length) {
            parser.displayError(errorFiles.join(", "), "Error converting the following " + errorFiles.length + " songs!");
        }

        //Complete! Show the success HTML
        parser.displaySuccessHtml(convertedFileContents, THIS_OUTPUT, FILE_EXTENSION);
    };

    //===================================
    //PRIVATE FUNCTIONS
    //===================================
    function _makeProPresenterFile(songData) {

        var ppDoc = _getPPDocBegin(songData);
        ppDoc += _makeBlankSlide(0);

        for (var i = 0; i < songData.slides.length; i++) {
            var slide = songData.slides[i];
            ppDoc += _makeSlide(i + 1, slide.title, slide.lyrics);
        }

        ppDoc += _makeBlankSlide(songData.slides.length + 1);

        ppDoc += '</slides><timeline timeOffSet="0" selectedMediaTrackIndex="0" unitOfMeasure="60" duration="0" loop="0"><timeCues containerClass="NSMutableArray"></timeCues><mediaTracks containerClass="NSMutableArray"></mediaTracks></timeline><bibleReference containerClass="NSMutableDictionary"></bibleReference></RVPresentationDocument>';

        return ppDoc;

    }

    function _getPPDocBegin(songData) {
        var keywords = '';
        var artist = '';
        var author = '';
        var year = '';
        var copyright = '';
        var ccli = '';

        var now = new Date();
        var todaysDate = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate() + "T" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

        //Loop through each info item and fill in the correct value if it exists
        for (var i = 0; i < songData.info.length; i++) {
            var info = songData.info[i];

            if (/copyright/i.test(info.name)) {
                var ccMatches = info.value.match(/(\d{4})(.*)/);
                if (ccMatches) {
                    if (ccMatches.length > 1) {
                        year = ccMatches[1];
                    }
                    if (ccMatches.length > 2) {
                        copyright = ccMatches[2];
                    }
                } else {
                    copyright = info.value;
                }
            } else if (/ccli/i.test(info.name)) {
                ccli = info.value;
            } else if (/keywords/i.test(info.name)) {
                keywords = info.value;
            } else if (/author|artist/i.test(info.name)) {
                artist = info.value;
                author = info.value;
            }
        }

        //Return the document beginning stringnew 
        return '<RVPresentationDocument height="768" width="1024" versionNumber="400" docType="0" creatorCode="1349676880" lastDateUsed="' + todaysDate + '" usedCount="0" category="Song" resourcesDirectory="" backgroundColor="0 0 0 1" drawingBackgroundColor="0" notes="' + keywords + '" artist="' + artist + '" author="' + author + '" album="" CCLIDisplay="0" CCLIArtistCredits="" CCLISongTitle="' + songData.title + '" CCLIPublisher="' + copyright + '" CCLICopyrightInfo="' + year + '" CCLILicenseNumber="' + ccli + '"><slides containerClass="NSMutableArray">';
    }

    function _generateUniqueID() {
        //Native PP ID Example: 26AAF905-8F45-4252-BFAB-4C10CCFE1476

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function _makeBlankSlide(order) {
        return '<RVDisplaySlide backgroundColor="0 0 0 0" enabled="1" highlightColor="0 0 0 0" hotKey="" label="" notes="" slideType="1" sort_index="' + order + '" UUID="' + _generateUniqueID() + '" drawingBackgroundColor="0" serialization-array-index="' + order + '"><cues containerClass="NSMutableArray"></cues><displayElements containerClass="NSMutableArray"></displayElements></RVDisplaySlide>';
    }

    function _makeSlide(order, label, text) {
        //Returns white Helvetica text in RTF format and then Base64 encoded
        //var fakeRTF="{\\rtf1\ansi\ansicpg1252\cocoartf1038\cocoasubrtf320{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}{\\colortbl;\\red255\\green255\blue255;}\pard\\tx560\\tx1120\\tx1680\\tx2240\\tx2800\\tx3360\\tx3920\\tx4480\\tx5040\\tx5600\\tx6160\\tx6720\qc\pardirnatural\\f0\\fs96 \cf1 "+ text.replace("\n","\\\n")+"}";

        var fakeRTF = ['{\\rtf1\\ansi\\ansicpg1252\\cocoartf1038\\cocoasubrtf320',
            '{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}',
            '{\\colortbl;\\red255\\green255\\blue255;}',
            '\\pard\\tx560\\tx1120\\tx1680\\tx2240\\tx2800\\tx3360\\tx3920\\tx4480\\tx5040\\tx5600\\tx6160\\tx6720\\qc\\pardirnatural',
            '',
            '\\f0\\fs96 \\cf1 \\\r' + text.replace(/\r|\n/g, "\\\r") + '}'
        ].join("\n");

        var encodedRtf = parser.utilities.encode(fakeRTF);

        //console.log(encodedRtf);

        var slideXML = ['',
            '<RVDisplaySlide backgroundColor="0 0 0 0" enabled="1" highlightColor="0 0 0 0" hotKey="" label="' + label + '" notes="" slideType="1" sort_index="' + order + '" UUID="' + _generateUniqueID() + '" drawingBackgroundColor="0" serialization-array-index="' + order + '">',
            '	<cues containerClass="NSMutableArray"></cues>',
            '	<displayElements containerClass="NSMutableArray">',
            '		<RVTextElement displayDelay="0" displayName="Default" locked="0" persistent="0" typeID="0" fromTemplate="0" bezelRadius="0" drawingFill="0" drawingShadow="0" drawingStroke="0" fillColor="1 1 1 1" rotation="0" source="" adjustsHeightToFit="0" verticalAlignment="0" RTFData="' + encodedRtf + '" serialization-array-index="0">',
            '			<_-RVRect3D-_position x="20" y="20" z="0" width="984" height="728"></_-RVRect3D-_position>',
            '			<_-D-_serializedShadow containerClass="NSMutableDictionary">',
            '				<NSCFNumber serialization-native-value="5" serialization-dictionary-key="shadowBlurRadius"></NSCFNumber>',
            '				<NSCalibratedRGBColor serialization-native-value="0 0 0 0.5" serialization-dictionary-key="shadowColor"></NSCalibratedRGBColor>',
            '				<NSCFString serialization-native-value="{3.53553, -3.53553}" serialization-dictionary-key="shadowOffset"></NSCFString>',
            '			</_-D-_serializedShadow>',
            '			<stroke containerClass="NSMutableDictionary">',
            '				<NSCachedRGBColor serialization-native-value="0 0 0 1" serialization-dictionary-key="RVShapeElementStrokeColorKey"></NSCachedRGBColor>',
            '				<NSCFNumber serialization-native-value="1" serialization-dictionary-key="RVShapeElementStrokeWidthKey"></NSCFNumber>',
            '			</stroke>',
            '		</RVTextElement>',
            '	</displayElements>',
            '</RVDisplaySlide>'
        ].join("\n");

        return slideXML;
    }

})();