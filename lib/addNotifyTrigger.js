const fsPromises = require('fs').promises;

const addNotifyTrigger = function({tableName, triggerName, triggersPath = 'triggers'}){
    try{
        // eslint-disable-next-line no-param-reassign
        triggerName = triggerName || `${tableName}_after_insert_update_delete_trigger`;
        const functionName = `${triggerName}_function`;

        if(functionName.length > 63){
            throw new Error('the trigger name is too long');
        }

        const trigger = `CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS TRIGGER AS $$
    const event = {
        action: TG_OP,
        id: NEW ? NEW.id : OLD.id
    };
    plv8.execute("SELECT pg_notify('${tableName}', $1);", [JSON.stringify(event)]);
    return;
$$ LANGUAGE plv8;

DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};

CREATE TRIGGER ${triggerName} AFTER INSERT OR UPDATE OR DELETE
    ON ${tableName}
    FOR EACH ROW EXECUTE PROCEDURE
    ${functionName}();`;

        return fsPromises.writeFile(`./${triggersPath}/${triggerName}.sql`, trigger);
    }
    catch(error){
        console.log('error: ', error);
        throw new Error(error);
    }
};

module.exports = addNotifyTrigger;