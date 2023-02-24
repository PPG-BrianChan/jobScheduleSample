service APIService @(
    // requires : 'system-user',
    // path     : '/api'
) {
    function scheduled_function() returns String;
    function getVar() returns String;
}