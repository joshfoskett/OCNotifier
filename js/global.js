var database;

function initDatabase(isBackground) {

    if(isBackground) {
    
        database = new localStorageDB("ocnotifier", localStorage);

    }else{

        database = chrome.extension.getBackgroundPage().getDatabase();

    }

    console.log('Database has been loaded.');

}

function getDatabase() {

    return database;
    
}

/* App: Settings */

function isSettingSet(settingType, settingValue) {

    return (getDatabase().query("settings", {type: settingType, value: settingValue}).length > 0);

}

function addSetting(settingType, settingValue) {

    if(!isSettingSet(settingType, settingValue)) {

        getDatabase().insert("settings", {type: settingType, value: settingValue});

        getDatabase().commit();

    }

}

function removeSetting(settingType, settingValue) {

    if(isSettingSet(settingType, settingValue)) {

        getDatabase().deleteRows("settings", {type: settingType, value: settingValue});

        getDatabase().commit();

    }

}

function toggleSetting(settingType, settingValue) {

    if(isSettingSet(settingType, settingValue)) {

        removeSetting(settingType, settingValue);

    }else{

        addSetting(settingType, settingValue);

    }

}