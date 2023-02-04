let MaterialButton = function(props){
	return (
		<button className="material unimportant" onClick={props.onClick}>
			<span className="material-icons">{props.name}</span>
		</button>
	);
}

let MaterialLargeButton = function(props){
	return (
		<button className="material large important" onClick={props.onClick}>
			<span className="material-icons">{props.name}</span>
		</button>
	);
}

let Covered = function(props){
	return <span className={
		"covered" +
		(props.size == "short" ? " short" : "") + 
		(props.size == "short2" ? " short2" : "") + 
		(props.size == "long" ? " long" : "") + 
		(props.size == "fullwidth" ? " long fullwidth" : "") + 
		(props.large ? " large" : "") + 
		(props.isOpen ? " isOpen" : "") +
		(props.isActive ? "" : " inactive")
	}
		onClick={props.onClick}
	>
		{ props.isOpen ? props.value : " " }
	</span>
}

let SettingRadios = function(props){
	return (
		<div className="buttons setting-item">
			{props.title && <div className="setting-title">{props.title}</div>}
			{props.prefix && <span>{props.prefix}</span>}
			{props.items.map( item  =>
			<label key={item.value}>
				<input type="radio" name={props.name} value={item.value}
					checked={props.value === item.value}
					onChange={() => props.setValue(item.value)} />
				<span>{item.caption}</span>
			</label>
			)}
		</div>
	);
}