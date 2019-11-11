
//	generic javascript stuff
function CreatePromise()
{
	const Prom = {};
	function SetResolveReject(Resolve,Reject)
	{
		Prom.Resolve = Resolve;
		Prom.Reject = Reject;
	};
	const NewPromise = new Promise(SetResolveReject);
	NewPromise.Resolve = Prom.Resolve;
	NewPromise.Reject = Prom.Reject;
	return NewPromise;
}

function CompareAscending(a,b)
{
	return a - b;
}

function CompareDescending(a,b)
{
	return b-a;
}


