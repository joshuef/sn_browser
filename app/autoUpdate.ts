import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { dialog } from 'electron';
import { logger } from '$Logger';
import * as notificationActions from '$Actions/notification_actions';

autoUpdater.autoDownload = false;

let store;

const addNotification = ( payload ) =>
    store.dispatch( notificationActions.addNotification( payload ) );

const clearNotification = ( payload: { id: string } ) =>
    store.dispatch( notificationActions.clearNotification( payload ) );

// Thow error incase there is an issue in updating
autoUpdater.on( 'error', ( error ) => {
    dialog.showErrorBox(
        'Error: ',
        error == null ? 'unknown' : ( error.stack || error ).toString()
    );
} );

// Check for update and ask if user wants to download it
autoUpdater.on( 'update-available', () => {
    const notificationId = Math.random().toString( 36 );
    const title = 'Update SAFE BROWSER';
    const body = 'Download Latest Version?';

    const ignoreRequest = () => {
        logger.info( 'replace these ipcRenderer.send calls' );
        clearNotification( { id: notificationId } );
    };

    const success = () => {
        autoUpdater.downloadUpdate();
        clearNotification( { id: notificationId } );
    };

    const denial = () => {
        logger.info( 'Denied downloading update' );
        clearNotification( { id: notificationId } );
    };

    const theNotification = {
        id: notificationId,
        type: 'warning',
        body,
        isPrompt: true,
        title,
        duration: 0
    };
    const responseMap = {
        allow: success,
        deny: denial,
        ignore: ignoreRequest
    };

    addNotification( theNotification );

    const stopListening = store.subscribe( () => {
        logger.info( 'Listener for updateBrowserNotification' );

        const state = store.getState();
        const { notifications } = state;

        if ( !notifications ) {
            return;
        }

        const ourNotification = notifications.find( ( n ) => n.id === notificationId );

        if ( !ourNotification || ourNotification === theNotification ) {
            return;
        }

        if ( ourNotification.response && responseMap[ourNotification.response] ) {
            responseMap[ourNotification.response]();
            stopListening();
        }
    } );
} );

autoUpdater.on( 'update-downloaded', () => {
    const notificationId = Math.random().toString( 36 );
    const title = 'Update Downloaded';
    const message = 'Update ready to be Installed';

    const ignoreRequest = () => {
        logger.info( 'replace these ipcRenderer.send calls' );
        clearNotification( { id: notificationId } );
    };

    const success = () => {
        autoUpdater.quitAndInstall();
        clearNotification( { id: notificationId } );
    };

    const denial = () => {
        logger.info( 'Update denied' );
        clearNotification( { id: notificationId } );
    };

    const theNotification = {
        id: notificationId,
        type: 'warning',
        isPrompt: true,
        title,
        body: message,
        duration: 0
    };

    const responseMap = {
        allow: success,
        deny: denial,
        ignore: ignoreRequest
    };

    addNotification( theNotification );

    const stopListening = store.subscribe( () => {
        logger.info( 'Listener for updateBrowserNotification' );

        const state = store.getState();
        const { notifications } = state;

        if ( !notifications ) {
            return;
        }

        const ourNotification = notifications.find( ( n ) => n.id === notificationId );

        if ( !ourNotification || ourNotification === theNotification ) {
            return;
        }

        if ( ourNotification.response && responseMap[ourNotification.response] ) {
            responseMap[ourNotification.response]();
            stopListening();
        }
    } );
} );

export class AppUpdater {
    public constructor( passedStore ) {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        store = passedStore;

        try {
            autoUpdater.checkForUpdatesAndNotify();
        } catch ( error ) {
            logger.error( 'Problems with auto updating...' );
            logger.error( error );
        }
    }
}