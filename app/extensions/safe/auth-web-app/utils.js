import classNames from 'classnames';
import CONSTANTS from './constants';

export const isUserAuthorised = () => window.safeAuthenticator.isAuthorised();

export const checkAuthorised = ( nextState, replace, callback ) => 
{
    if ( !isUserAuthorised() )
    {
        replace( '/login' );
    }
    callback();
};

export const getStrengthMsg = strength => 
{
    switch ( true )
    {
        case strength === 0: {
            return '';
        }
        case strength < CONSTANTS.PASSPHRASE_STRENGTH.VERY_WEAK:
            return CONSTANTS.PASSPHRASE_STRENGTH_MSG.VERY_WEAK;
        case strength < CONSTANTS.PASSPHRASE_STRENGTH.WEAK:
            return CONSTANTS.PASSPHRASE_STRENGTH_MSG.WEAK;
        case strength < CONSTANTS.PASSPHRASE_STRENGTH.SOMEWHAT_SECURE:
            return CONSTANTS.PASSPHRASE_STRENGTH_MSG.SOMEWHAT_SECURE;
        case strength >= CONSTANTS.PASSPHRASE_STRENGTH.SECURE:
            return CONSTANTS.PASSPHRASE_STRENGTH_MSG.SECURE;
        default:
    }
};

export const parseErrCode = errStr => 
{
    try
    {
        const err = JSON.parse( errStr );
        switch ( parseInt( err.error_code, 10 ) )
        {
            case -3: {
                return {
                    code        : err.error_code,
                    description : 'Incorrect Password'
                };
            }
            case -101: {
                return {
                    code        : err.error_code,
                    description : 'Account does not exist'
                };
            }
            case -102: {
                return {
                    code        : err.error_code,
                    description : 'Account already exist'
                };
            }
            case -116: {
                return {
                    code        : err.error_code,
                    description : 'Invalid invitation'
                };
            }
            case -117: {
                return {
                    code        : err.error_code,
                    description : 'Invitation already claimed'
                };
            }
            default: {
                return {
                    code        : err.error_code,
                    description : err.description
                };
            }
        }
    }
    catch ( err )
    {
        return 'Something went wrong. Please try again';
    }
};

export const parseAppName = name => 
{
    const parsedName = name.replace( /-|_/g, ' ' );
    // if the app's name it's just a sequence
    // of '-' and/or '_' chars, then return it as is
    if ( parsedName.trim().length === 0 ) return name;

    return parsedName
        .split( ' ' )
        .map( i => `${ i[0].toUpperCase() }${ i.slice( 1 ) }` )
        .join( ' ' );
};

export const getAppIconClassName = i => 
{
    const index = ( parseInt( i, 10 ) + 1 ) % 6;
    return classNames( 'app-list-i-h', 'app-icon', `app-icon-clr-${ index || 6 }` );
};

export const storeReAuthoriseState = state => localStorage.setItem( CONSTANTS.RE_AUTHORISE.KEY, JSON.stringify( { state } ) );

export const fetchReAuthoriseState = () => 
{
    const data = localStorage.getItem( CONSTANTS.RE_AUTHORISE.KEY );
    return data ? JSON.parse( data ).state : null;
};
