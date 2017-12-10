function FamilyTree() {
  this.root
  this.generations
}

FamilyTree.prototype.preprocess = function(data) {
  this.root = {
    "name": "root",
    "childNodes": [
    ]}

  this.root.childNodes = data.partners ? "yes" : "no"

  }
