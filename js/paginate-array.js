function paginateArray (array, itemsPerPage){
  return array.reduce(function(pairs, item, index){
      var group = Math.ceil((index+1)/itemsPerPage),  
        currentPair = (pairs[group] || []).concat(item)
      pairs[group] = currentPair
      return pairs
  },{})
}
