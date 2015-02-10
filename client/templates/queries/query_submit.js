Template.querySubmit.events({
    'submit form': function(e) {
        e.preventDefault();

        var query = {
            _id: $("#inputID").val(),
            name: $("#inputName").val(),
            url: $("#inputURL").val(),
            subscribed: $("#inputSub").is(':checked'),
            ert: parseInt($("#inputERT").val()),
            ent: parseInt($("#inputENT").val()),
            freq: parseInt($("#inputFreq").val())
        };
        Meteor.call('queryInsert', query, function(error, result) {
            if (error) {
                return alert(error.reason);
            }
            if (result.idTaken) {
                return alert('There is already a monitoring job with that id.');
            }
            if (result.urlExists) {
                return alert('There is already a monitoring job for the supplied URL.');
            }
            Router.go('queryPage', {_id: result._id});
        });
    }
});
