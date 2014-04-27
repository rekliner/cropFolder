#target photoshop

/*********************************************************************
Crop image folder to smallest... (1.0 I suppose) - a concievably useful-to-others script by Chris Kline
This will crop a folder of images to the smallest height and the smallest width independatly within the images to be cropped.
This has the effect of making all their aspect ratios the same
You can also specify the width and/OR height to manually crop a folder full of images  to the same dimensions
All crops are centered (to do: add a button set to direct crops per the actual crop dialogue)
Output is saved to a subfolder called "/cropped"
 Heavily bastardized from the Batch HDR Script by David Milligan
 mainly because tripodless HDR processing leaves me with different image sizes & aspect ratios and I've been fiddling with HDR panoramics.
*********************************************************************/

/*********************************************************************
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
**********************************************************************/

/*
// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>Crop image folder to smallest...</name>
<menu>automate</menu>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING
*/


var inputFolder;
var jpegQuality = 8;
var progress;
var statusText;
var progressWindow;


var smallestWidth = 999999;  //arbitrarily large number for lazy programming
var smallestHeight = 999999;
var manualCropWidth = null;
var manualCropHeight = null;

function main()
{
    promptUser();
    
    //make sure user didn't cancel
    if(inputFolder != null && inputFolder.exists)
    {
        initializeProgress();

        var files =  inputFolder.getFiles("*.jpg");
        files.sort();
        var numberOfFiles = files.length;
        
        if (manualCropWidth == null || manualCropHeight == null) { //if both width and height have been specified there is no need to scan folder for minimum.

            //find the smallest dimensions of the images in a folder
            for(var index = 0;  index < numberOfFiles; index++)
            {
                var buildStatus= "Scanning result "+(index+1)+" of "+numberOfFiles;// + "  W=" + smallestWidth + "  H=" + smallestHeight ;
                buildStatus += " Width";
                if (manualCropWidth != null) { buildStatus += " (forced):" + manualCropWidth;} else { buildStatus += ":" + smallestWidth;} 
               buildStatus += " Height";
               if (manualCropHeight != null) { buildStatus += " (forced):" + manualCropHeight;} else { buildStatus += ":" + smallestHeight;} 
                statusText.text =buildStatus;
                doOpenFile(files[index]);
                if (app.activeDocument.width.as('px') < smallestWidth) { smallestWidth = app.activeDocument.width.as('px')}
                if (app.activeDocument.height.as('px') < smallestHeight) { smallestHeight = app.activeDocument.height.as('px')}
                activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            }  
            //folder has been scanned
         } 
        if ( manualCropWidth != null) {    smallestWidth = parseInt(manualCropWidth);};
        if ( manualCropHeight != null) {    smallestHeight = parseInt(manualCropHeight);};


        
        //output settings
        var outputFolder = new Folder(inputFolder.absoluteURI + "/cropped" );
          if(!outputFolder.exists) outputFolder.create();
         var jpgSaveOptions = new JPEGSaveOptions();
        jpgSaveOptions.embedColorProfile = true;
        jpgSaveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
        jpgSaveOptions.matte = MatteType.NONE;
        jpgSaveOptions.quality = jpegQuality;
       
        //iterate through those images again
        for(var index = 0;  index < numberOfFiles; index++)
        {
            doOpenFile(files[index]);
            statusText.text = "Cropping result "+(index+1)+" of "+numberOfFiles;
            //crop the files to the manual settings or the dimensions of the smallest width and height in the folder
            
            Left = Math.floor((app.activeDocument.width.as('px') - smallestWidth) /2);
            Top = Math.floor((app.activeDocument.height.as('px') - smallestHeight) /2);
            var Bottom = Top + smallestHeight;
            var Right = Left + smallestWidth;
            activeDocument.selection.select([[Left,Top],[Right,Top],[Right,Bottom],[Left,Bottom]], SelectionType.REPLACE, 0, false); 
            executeAction(charIDToTypeID( "Crop" ), new ActionDescriptor(), DialogModes.NO );

            activeDocument.saveAs(new File(outputFolder.absoluteURI + "/" + activeDocument.name), jpgSaveOptions, true /*Save As Copy*/, Extension.LOWERCASE /*Append Extention*/);
          
            activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
  
  
  
     progressWindow.hide();
    }
}

function doOpenFile(filename)
{
    
    const eventOpen = app.charIDToTypeID('Opn ');
    var desc = new ActionDescriptor();
    desc.putPath( charIDToTypeID('null'), new File( filename ) );
  //  desc.putBoolean( kpreferXMPFromACRStr, true ); //not sure what this does or if it is needed
    executeAction( eventOpen, desc, DialogModes.NO );
  }


function initializeProgress()
{
    progressWindow = new Window("palette { text:'Batch Crop Progress', \
        statusText: StaticText { text: 'Scanning Images...', preferredSize: [350,20] }, \
        progressGroup: Group { \
            progress: Progressbar { minvalue: 0, maxvalue: 100, value: 0, preferredSize: [300,20] }, \
            cancelButton: Button { text: 'Cancel' } \
        } \
    }");
    statusText = progressWindow.statusText;
    progress = progressWindow.progressGroup.progress;
    progressWindow.progressGroup.cancelButton.onClick = function() { userCanceled = true; }
    progressWindow.show();
}


function promptUser()
{
    var setupWindow = new Window("dialog { orientation: 'row', text: 'Batch Crop', alignChildren:'top', \
        leftGroup: Group { orientation: 'column', alignChildren:'fill', \
             manualCropLabel: StaticText { text: 'Manually crop to these dimensions (leave one or both blank for smallest dimension in folder): ' }\
             manualCropGroup: Group { \
                manualCropWidthGroup: Group { \
                    manualCropWidthLabel: StaticText { text: 'Width: ' }, \
                    manualCropWidthText: EditText { characters: 4}, \
                    manualCropWidthLabel: StaticText { text: 'px' }, \
               }\
                manualCropHeightGroup: Group { \
                    manualCropHeightLabel: StaticText { text: 'Height: ' }, \
                    manualCropHeightText: EditText { characters: 4}, \
                    manualCropWidthLabel: StaticText { text: 'px' }, \
                }\
                manualCropClearButton: Button { text: 'Clear' }, \
           } \
            inputPanel: Panel { text: 'Input Folder', \
                inputGroup: Group { \
                    inputBox: EditText { characters: 40, text: '' }, \
                    inputBrowse: Button { text: 'Browse' } \
                }, \
                saveSettingsGroup: Group { \
                    jpegQualityLabel: StaticText { text: 'Output to .../cropped at JPEG Quality (1-10): ' }, \
                    jpegQualityText: EditText { characters: 2}, \
               } \
            } \
        }, \
        rightGroup: Group { orientation: 'column', alignChildren:'fill', \
            okButton: Button { text: 'OK', enabled: false } \
            cancelButton: Button { text: 'Cancel' } \
        } \
    } ");
    
    
    //shortcut variables
    var inputBox = setupWindow.leftGroup.inputPanel.inputGroup.inputBox;
    var inputBrowse = setupWindow.leftGroup.inputPanel.inputGroup.inputBrowse;
    var manualCropWidthText = setupWindow.leftGroup.manualCropGroup.manualCropWidthGroup.manualCropWidthText;
    var manualCropHeightText = setupWindow.leftGroup.manualCropGroup.manualCropHeightGroup.manualCropHeightText;
    var manualCropClearButton = setupWindow.leftGroup.manualCropGroup.manualCropClearButton;
    var jpegQualityText = setupWindow.leftGroup.inputPanel.saveSettingsGroup.jpegQualityText;
//    var jpegQualityLabel = setupWindow.leftGroup.inputPanel.saveSettingsGroup.jpegQualityLabel;
    var okButton = setupWindow.rightGroup.okButton;
    var cancelButton = setupWindow.rightGroup.cancelButton;
 
   jpegQualityText.text = jpegQuality;

    inputBox.onChange = function()
    {
        inputFolder = new Folder(inputBox.text);
        okButton.enabled =  inputFolder != null  && inputFolder.exists;
    };
    inputBrowse.onClick = function()
    {
        inputFolder = Folder.selectDialog ("Select the output folder");
        if(inputFolder != null)
        {
            inputBox.text = inputFolder.fullName;
        }
        okButton.enabled = inputFolder != null && inputFolder.exists;
    };


    manualCropWidthText.onChange = function() { manualCropWidth= manualCropWidthText.text; };
    manualCropHeightText.onChange = function() { manualCropHeight = manualCropHeightText.text; };
     manualCropClearButton.onClick = function() { manualCropWidth = null; manualCropWidthText.text =  ""; manualCropHeight = null; manualCropHeightText.text = "";};

    jpegQualityText.onChange = function() { jpegQuality = jpegQualityText.text; };

    okButton.onClick = function() { setupWindow.hide();  };
    cancelButton.onClick = function() { inputFolder = null, setupWindow.hide();  };
    

    
    setupWindow.show();
}


main();

