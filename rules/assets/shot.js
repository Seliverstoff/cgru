shot_thumb_paths = [];

function shot_Show()
{
	shot_thumb_paths = [];
	a_SetLabel('Shot');
	$('asset').innerHTML = '<div style="text-align:center">Scanning shot sequences...</div>';

	var walk = {};
	walk.paths = [];
	if( ASSET.result )
	{
		walk.result = [];
		for( var r = 0; r < ASSET.result.path.length; r++)
		{
			walk.result.push( walk.paths.length);
			walk.paths.push( ASSET.path + '/' + ASSET.result.path[r]);
		}
	}
	if( ASSET.dailies )
	{
		walk.dailies = [];
		for( var r = 0; r < ASSET.dailies.path.length; r++)
		{
			walk.dailies.push( walk.paths.length);
			walk.paths.push( ASSET.path + '/' + ASSET.dailies.path[r]);
		}
	}

	walk.mtime = RULES.cache_time;
	if( ASSET.cache_time ) walk.mtime = ASSET.cache_time;
	walk.wfunc = shot_Loaded;
	n_WalkDir( walk);
}

function shot_Loaded( i_data, i_args)
{
	var walk = i_args;
	walk.walks = i_data;
	$('asset').textContent = '';

	if( ASSET.references )
	{
		var elRefs = document.createElement('div');
		u_el.asset.appendChild( elRefs);
		elRefs.classList.add('source');
		elRefs.classList.add('button');
		elRefs.textContent = 'Show References';
		elRefs.style.cssFloat = 'left';
		elRefs.onclick = shot_RefsOnClick;
	}

	if( ASSET.source )
	{
		var elSource = document.createElement('div');
		u_el.asset.appendChild( elSource);
		elSource.classList.add('source');
		elSource.classList.add('button');
		elSource.textContent = 'Scan Sources';
		elSource.style.cssFloat = 'left';
		elSource.onclick = shot_SourceOnClick;
	}

	if( ASSET.result )
	{
		var elResult = document.createElement('div');
		u_el.asset.appendChild( elResult);
		elResult.classList.add('result');

		var founded = false;
		for( var i = 0; i < walk.result.length; i++)
		{
			var folders = walk.walks[walk.result[i]].folders;
			var path = walk.paths[walk.result[i]];
			if(( folders == null ) || ( folders.length == 0 )) continue;

			shot_thumb_paths.push( path);
			new FilesView({"el":elResult,"path":path,"walk":walk.walks[walk.result[i]]})
			founded = true;
		}

		if( false == founded )
			elResult.textContent = JSON.stringify( ASSET.result.path );
	}

	if( ASSET.dailies )
	{
		var elDailies = document.createElement('div');
		u_el.asset.appendChild( elDailies);
		elDailies.classList.add('resdailies');

		var founded = false;
		for( var i = 0; i < walk.dailies.length; i++)
		{
			var path = walk.paths[walk.dailies[i]];
			var files = walk.walks[walk.dailies[i]].files;
			var folders = walk.walks[walk.dailies[i]].folders;
			if(( files && files.length ) || ( folders && folders.length ))
			{
				new FilesView({"el":elDailies,"path":path,"walk":walk.walks[walk.dailies[i]]});
				if( shot_thumb_paths.length == 0 )
					shot_thumb_paths.push( path);
				founded = true;
			}
		}

		if( false == founded )
			elDailies.textContent = JSON.stringify( ASSET.dailies.path );
	}

	shot_MakeThumbnail( shot_thumb_paths);

	shot_Post();
}

function shot_Post()
{
	g_POST();
}

function shot_MakeThumbnail()
{
	if( shot_thumb_paths.length == 0 ) return;

	var file = ASSET.path + '/'+RULES.rufolder+'/' + RULES.thumbnail.filename;

	var cache_time = RULES.cache_time;
	if( ASSET.cache_time ) cache_time = ASSET.cache_time;
	if( u_thumbstime[file] && ( c_DT_CurSeconds() - u_thumbstime[file] < cache_time ))
	{
		c_Log('Thumbnail cached '+cache_time+'s: '+file);
		return;
	}

	var input = null;
	for( var i = 0; i < shot_thumb_paths.length; i++ )
	{
		if( input ) input += ',';
		else input = '';
			input += RULES.root + shot_thumb_paths[i];
	}
	var output = RULES.root + file;
	var cmd = RULES.thumbnail.cmd_asset.replace(/@INPUT@/g, input).replace(/@OUTPUT@/g, output);
	n_Request({"send":{"cmdexec":{"cmds":[cmd]}},"func":u_UpdateThumbnail,"info":'shot thumbnail',"local":true,"wait":false,"parse":true});
}

function shot_RefsOnClick( i_evt)
{
	var el = i_evt.currentTarget;

	if( el.m_opened ) return;

	el.m_opened = true;
	el.textContent = 'Loading Shot References...';
	el.style.cssFloat = 'none';
	el.classList.remove('button');
	el.classList.add('waiting');
	el.classList.add('result');

	var walk = {};
	walk.paths = [];
	walk.el = el;
	for( var i = 0; i < ASSET.references.path.length; i++)
		walk.paths.push( ASSET.path + '/' + ASSET.references.path[i]);

	walk.wfunc = shot_RefsReceived;
	n_WalkDir( walk);
}
function shot_RefsReceived( i_data, i_args)
{
	var walk = i_args;
	walk.walks = i_data;

	i_args.el.textContent = '';
	i_args.el.classList.remove('waiting');
//console.log( i_data);
	var founded = false;
	var not_empty_paths = [];
	for( var i = 0; i < walk.paths.length; i++)
	{
		var folders = walk.walks[i].folders;
		var files = walk.walks[i].files;

		if((( folders == null ) || ( folders.length == 0 )) &&
			((  files == null ) || (   files.length == 0 )))
			 continue;
		not_empty_paths.push( walk.paths[i]);
		new FilesView({"el":i_args.el,"path":walk.paths[i],"walk":walk.walks[i]})
		founded = true;
	}
	if( false == founded )
		i_args.el.textContent = JSON.stringify( walk.paths );

	if( shot_thumb_paths.length == 0 )
	{
		shot_thumb_paths = not_empty_paths;
		shot_MakeThumbnail();
	}
}

function shot_SourceOnClick( i_evt)
{
	var el = i_evt.currentTarget;
	var elSource = el;

	if( elSource.m_scanned ) return;

	elSource.m_scanned = true;
	elSource.textContent = 'Scanning Shot Source Sequences...';
	elSource.style.cssFloat = 'none';
	elSource.classList.remove('button');
	elSource.classList.add('waiting');
	elSource.classList.add('result');

	var paths = [];
	for( var i = 0; i < ASSET.source.path.length; i++)
		paths.push( ASSET.path + '/' + ASSET.source.path[i]);
	n_WalkDir({"paths":paths,"depth":5,"wfunc":shot_SourceReceived,"el":elSource,"local":true});
}
function shot_SourceReceived( i_data, i_args)
{
	i_args.el.textContent = '';
	i_args.el.classList.remove('waiting');
	var founded = false;
	var not_empty_paths = [];
	for( var i = 0; i < i_data.length; i++)
	{
		var flist = [];
		shot_SourceWalkFind( i_data[i], flist);
		if( flist.length )
		{
			new FilesView({"el":i_args.el,"path":i_args.paths[i],"walk":{"folders":flist},"limits":false,"thumbs":false,"refresh":false});
			not_empty_paths.push( i_args.paths[i]);
			founded = true;
		}
	}

	if( false == founded )
		elSource.textContent = JSON.stringify( ASSET.source.path);

	if( shot_thumb_paths.length == 0 )
	{
		shot_thumb_paths = not_empty_paths;
		shot_MakeThumbnail();
	}
}

function shot_SourceWalkFind( i_walk, o_list, i_path)
{
//window.console.log( JSON.stringify( i_walk).replace(/,/g,', '));
	if( i_walk.folders == null ) return;

	i_walk.folders.sort( c_CompareFiles );
	for( var f = 0; f < i_walk.folders.length; f++)
	{
		var fobj = i_walk.folders[f];
//console.log(JSON.stringify(fobj));
		var path = i_path;
		if( path ) path += '/' + fobj.name;
		else path = fobj.name;
		if( fobj.files && fobj.files.length)
		{
			fobj.name = path;
			o_list.push( fobj);
		}
		shot_SourceWalkFind( fobj, o_list, path);
	}
}

if( ASSETS.shot && ( ASSETS.shot.path == g_CurPath()))
{
	shot_Show();
}

