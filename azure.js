var azure = require('azure-storage');
var blobService = azure.createBlobService();

for (repo_downloaded in all_repos) {
    blobService.createBlockBlobFromLocalFile('mycontainer', 'taskblob', 'repo_downloaded', function(error, result, response));
}