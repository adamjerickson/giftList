Lists = new Meteor.Collection("lists");
//Need another collection for other people's lists.

// Utility functions
  function makeid()
  {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 17; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
  }


if (Meteor.isClient) {

  //subscribe...
  Meteor.subscribe("userLists");
  Meteor.subscribe("othersLists");
  
  // Lists helpers
  Template.lists.userLists = function() {
    return Lists.find({owner: Meteor.userId()});
  }

  Template.lists.othersLists = function() {
    return Lists.find({owner: {$ne: Meteor.userId()}});
  }

  // Lists events
  Template.lists.events({
    "click .list" : function(event, template) {
      console.log(this._id);
      console.log('clicked');
      console.log(this);
      console.log(this.parent);
      console.log(event.target);
      console.log(template); //??????

    }
  });

  // Items helpers

  // Item helpers
  Template.item.editing = function(argument) {
    if (Session.get("editingItem") === argument) { // set in the edit event
      return true;  
    }
    return false;
  }

  // Item events
  Template.item.events({
    'click .edit' : function(event, template) {
      if (Session.get("editingItem") !== this._id) {
        Session.set("editingItem", this._id);
        console.log(Session.get("editingItem"));
      }
      return true;
    },

    'click .saveItem' : function(event) {
      event.preventDefault()
      Meteor.call('editItem', this._id, $('.editItemTitle').val(), $('.editItemDescription').val(), function(error, result) {console.log(error); console.log(result);})
      Session.set("editingItem", null);
    }

  });

  Template.item.isLoggedInUser = function () {
    return Meteor.userId() === this.owner;
  }

  Template.addItem.events({
    'click .btn' : function(event) {
      event.preventDefault();
      Lists.update({_id: this._id}, {$addToSet: {'items': {_id: makeid(), 'title': $('#inputTitle').val(), 'description': $('#inputDescription').val(), 'owner': this.owner }}});
      $('#addItem')[0].reset();
      return false;
    }
  });

  Template.addComment.events({
    'click .btn' : function(event) {
      event.preventDefault();
      
      //Lists.update({'._id': this.parent._id}, {$addToSet: {'comments': {'text': 'some text', 'commenter': 'Greg' }}});
      Meteor.call("addComment", this._id, $('#commentText').val(), Meteor.user().profile.name, function(error, result) {console.log(error); console.log(result);});
      $('#addComment')[0].reset();

      return false; // prevent page submit
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    //Publish...
    Meteor.publish("userLists", function() {
      this.ready();
      return Lists.find({owner: this.userId}, {fields: {"items.comments": 0, "items.purchasers": 0}});
    });
    Meteor.publish("othersLists", function() {
      this.ready();
      return Lists.find({owner: {$ne: this.userId}});
    });

    
    // Testing code.  This clears the database...
    /*if (Lists.find().count() >= 1) {
      Lists.remove({});
    } */

    if (Lists.find().count() === 0) {     
      Lists.insert({
        owner: "sDBkuxDKbk64nkucQ",
        name: "My First List",
        items: [{_id: "2980324fka0911bfioafa",
                 title: "Item 1", /// needs an owner, but that's hard to do in server side insert code.
                 owner: "sDBkuxDKbk64nkucQ",
                 description: "Description of Item 1",
                 purchasers: [{purchaser: "UserID1"}, {purchaser: "UserID2"}, {purchaser: "UserID3"}],
                 comments: [{text: "This is a comment", commenter: "UserID1"},
                            {text: "This is also a comment", commenter: "UserID2"}]
               }]
      });
      Lists.insert({
        owner: "88888",
        name: "My Second List",
        items: [{_id: "907821378bcbjkbjjk7",
                 title: "Item A",
                 owner: "88888",
                 description: "Description of Item A",
                 purchasers: [{purchaser: "UserIDA"}, {purchaser: "UserIDB"}, {purchaser: "UserIDC"}],
                 comments: [{text: "A. This is a comment", commenter: "UserIDA"},
                            {text: "B. This is also a comment", commenter: "UserIDB"}]
               }]
      });
    }
  });
  
  Meteor.methods({
    addComment: function (itemId, text, commenter) {
      Lists.update({'items._id': itemId}, {$addToSet: {'items.$.comments': {'text': text, 'commenter': commenter }}});
      return itemId + " : " + text + " : " + commenter; 
    },
    editItem: function(itemId, title, description) {
      // $$$$ not working because of the context.  even though we're selecting where items._id = something, we're still returning the whole List, not hte item.  So we need to update just the item somehow.
      Lists.update({"items._id" : itemId}, {$set: {'items.$.title': title, 'items.$.description': description}});
      //return itemId + " : " + title + " : " + description; 
      return Lists.find({'items._id': itemId}).fetch();
    }
  })

}



