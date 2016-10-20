
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <title>Demo</title>

    <script src="//code.jquery.com/jquery-2.2.4.min.js"></script>

    <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" />
    <script src="//code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>

    <link href="tokenize2.css" rel="stylesheet" />
    <script src="tokenize2.js"></script>
    <link href="demo.css" rel="stylesheet" />

</head>
<body>



    <div class="list">
    </div>



<button js-addLine>Add new line</button>



<script>
var temp, id, newID;

    temp = 0 
    $( ".tokenize-callable-demo1" ).each(function() {
      id = $( this ).attr( "id" )
      id= id.replace(/[^0-9\.]/g, '');
      if(id > temp){
        temp = id;
      }
        newID = 'select'+(temp+1);
    });

    template = '<div class="panel-body"><select class="tokenize-callable-demo1" id="'+newID+'" multiple></select></div>';

    $( '[js-addLine]' ).click(function() {
      $( ".list" ).append( template  );

      $('.tokenize-callable-demo1').tokenize2({
        placeholder: 'Please add new tokens',
        sortable: true,
        tokensAllowCustom: true,
        tokensMaxItems: 5,
        dataSource: function(search, object){
            $.ajax('remote.php', {
                data: { search: search, start: 0 },
                dataType: 'json',
                success: function(data){
                    var $items = [];
                    $.each(data, function(k, v){
                        $items.push(v);
                    });
                    object.trigger('tokenize:dropdown:fill', [$items]);
                }
            });
        }
    });

    $.extend($('#'+newID+'.tokenize-callable-demo1').tokenize2(), {
        dropdownItemFormat: function(v){
            return $('<a />').html(v.text + ' ' + v.long).attr({
                'data-value': v.value,
                'data-long': v.long,
                'data-text': v.text
            })
        }
    });


  });

$( '[js-addLine]' ).click();


</script>

           
</body>
</html>