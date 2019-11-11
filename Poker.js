//	make this a module
const Poker = {};

class PlayingCards
{
	static SuitHeart = 1;
	static SuitDiamond = 2;
	static SuitClub = 3;
	static SuitSpade = 4;
	static Values = [ 2,3,4,5,6,7,8,9,10,11,12,13,14 ];
	static Suits =
	[
	 PlayingCards.SuitHeart,
	 PlayingCards.SuitDiamond,
	 PlayingCards.SuitClub,
	 PlayingCards.SuitSpade
	 ];
	
	static NameMap =
	[
	 [PlayingCards.SuitHeart,"&hearts;"],
	 [PlayingCards.SuitDiamond,"&diams;"],
	 [PlayingCards.SuitClub,"&clubs;"],
	 [PlayingCards.SuitSpade,"&spades;"],
	 []
	];
	static SuitNames = Object.fromEntries( new Map( PlayingCards.NameMap ) );
	
	
	static CardNames =
	{
		11:"Jack",
		12:"Queen",
		13:"King",
		14:"Ace"
	};

};




function GetAllCards()
{
	const Cards = [];

	for ( let v of PlayingCards.Values )
	{
		for ( let s of PlayingCards.Suits )
		{
			const Card = (v * 10) + s;
			Cards.push(Card);
		}
	}
	//console.log(Cards);
	return Cards;
}



function GetCardValue(Card)
{
	return Math.floor( Card / 10 );
}

function GetCardSuit(Card)
{
	const Suit = (Card % 10);
	if ( Suit == 0 )
		throw "Invalid card";
	return Suit;
}

function IsHeart(Card)		{	return GetCardSuit(Card) == PlayingCards.SuitHeart;		}
function IsClub(Card)		{	return GetCardSuit(Card) == PlayingCards.SuitClub;		}
function IsSpade(Card)		{	return GetCardSuit(Card) == PlayingCards.SuitSpade;		}
function IsDiamond(Card)	{	return GetCardSuit(Card) == PlayingCards.SuitDiamond;		}


function GetSortedFiveCards(Cards)
{
	function Compare(a,b)
	{
		const va = GetCardValue(a);
		const vb = GetCardValue(b);
		if ( va > vb )	return -1;
		if ( va < vb )	return 1;
		return 0;
	}
	Cards.sort( Compare );
	Cards.length = Math.min( 5, Cards.length );
	return Cards;
}

function GetNCardsWithValue(Cards,Value,Limit)
{
	const VCards = Cards.filter( c => GetCardValue(c) == Value );
	VCards.length = Math.min( Limit, VCards.length );
	return VCards;
}

function GetCardToString(Card)
{
	const Suit = GetCardSuit(Card);
	const SuitName = PlayingCards.SuitNames[Suit];
	const CardValue = GetCardValue(Card);
	let CardName = PlayingCards.CardNames[CardValue];
	if ( !CardName )
		CardName = CardValue;

	return SuitName + CardName;
}

function GetHandToString(Cards)
{
	const Names = Cards.map( GetCardToString );
	return Names.join(', ');
}

//	return the best straight+flush hand (5)
function GetStraightFlushHand(Cards)
{
	function GetStraightHandOfSuit(IsSuitFunc)
	{
		const Hearts = Cards.filter( c => IsSuitFunc(c) );
		if ( Hearts.length < 5 )
			return false;
		
		const StraightHand = GetStraightHand(Hearts);
		return StraightHand;
	}
	
	const Hearts = GetStraightHandOfSuit( IsHeart );
	const Spades = GetStraightHandOfSuit( IsSpade );
	const Clubs = GetStraightHandOfSuit( IsClub );
	const Diamonds = GetStraightHandOfSuit( IsDiamond );
	if ( Hearts )	return Hearts;
	if ( Spades )	return Spades;
	if ( Clubs )	return Clubs;
	if ( Diamonds )	return Diamonds;
	return false;
}


//	return the best flush (5)
function GetFlushHand(Cards)
{
	const Hearts = Cards.filter( c => IsHeart(c) );
	const Spades = Cards.filter( c => IsSpade(c) );
	const Clubs = Cards.filter( c => IsClub(c) );
	const Diamonds = Cards.filter( c => IsDiamond(c) );
	if ( Hearts.length >= 5 )
		return GetSortedFiveCards(Hearts);
	if ( Spades.length >= 5 )
		return GetSortedFiveCards(Spades);
	if ( Clubs.length >= 5 )
		return GetSortedFiveCards(Clubs);
	if ( Diamonds.length >= 5 )
		return GetSortedFiveCards(Diamonds);
	return false;
}

//	return the best straight hand (5)
function GetStraightHand(Cards)
{
	const Values = Cards.map( GetCardValue );
	Values.sort(CompareDescending);
	//	remove duplicates
	const UniqueValues = [...new Set(Values)];
	if ( UniqueValues.length < 5 )
		return false;
	
	function IsSequence(Array)
	{
		for ( let i=1;	i<Array.length;	i++ )
			if ( Array[i-1] != Array[i]-1 )
				return false;
		return true;
	}
	
	//	for each number, count up 5 in a row
	//	in reverse to get best result first
	for ( let i=4;	i<UniqueValues.length;	i++ )
	{
		let Set = UniqueValues.slice( i-4, i+1 );
		if ( Set.length != 5 )	throw "Programmer error";
		if ( !IsSequence(Set) )
			continue;
		
		//	grab cards from original bunch that match this set
		function GetStraightCard(CardValue)
		{
			function MatchCardValue(Card)
			{
				return GetCardValue(Card) == CardValue;
			}
			const Card = Cards.find( MatchCardValue );
			if ( Card === undefined )	throw "Failed to match this card in original bunch";
			return Card;
		}
		const StraightCards = Set.map( GetStraightCard );
		return GetSortedFiveCards(StraightCards);
	}
	return false;
}


function GetFullHouseHand(Cards)
{
	//	for any 5, is there 3 & 2...
	const Threes = [];
	const Pairs = [];
	const Values = Cards.map( GetCardValue );
	for ( let v of PlayingCards.Values )
	{
		const MatchingValues = Values.filter( c => c==v );
		if ( MatchingValues.length >= 3 )
			Threes.push( v );
		if ( MatchingValues.length == 2 )
			Pairs.push( v );
	}
	if ( Threes.length == 0 || Pairs.length == 0 )
		return false;
	if ( Threes.length > 1 )
		Threes.sort(CompareDescending);
	if ( Pairs.length > 1 )
		Pairs.sort(CompareDescending);
	
	//	pick any 3 cards matching Threes[0]
	//	pick any 2 cards matching Pairs[0]
	const ThreeCards = GetNCardsWithValue( Cards, Threes[0], 3 );
	const PairCards = GetNCardsWithValue( Cards, Pairs[0], 2 );
	
	const FullHouseCards = ThreeCards.concat( PairCards );
	return GetSortedFiveCards( FullHouseCards );
}

function GetFourOfAKindHand(Cards)
{
	const Values = Cards.map( GetCardValue );
	for ( let v of PlayingCards.Values.reverse() )
	{
		const MatchingValues = Values.filter( c => c==v );
		if ( MatchingValues.length > 4 )
			throw "Invalid case, >4 four of a kind";
		if ( MatchingValues.length < 4 )
			continue;
		
		//	grab 4 cards with this value
		const Hand = GetNCardsWithValue( Cards, v, 4 );
		return Hand;
	}
	return false;
}


function GetThreeOfAKindHand(Cards)
{
	const Values = Cards.map( GetCardValue );
	for ( let v of PlayingCards.Values.reverse() )
	{
		const MatchingValues = Values.filter( c => c==v );
		if ( MatchingValues.length < 3 )
			continue;
		
		//	grab 3 cards with this value
		const Hand = GetNCardsWithValue( Cards, v, 3 );
		return Hand;
	}
	return false;
}

function GetTwoPairHand(Cards)
{
	let PairHi = null;
	let PairLo = null;
	const Values = Cards.map( GetCardValue );
	for ( let v of PlayingCards.Values.reverse() )
	{
		const MatchingValues = Values.filter( c => c==v );
		if ( MatchingValues.length < 2 )
			continue;
		if ( PairHi === null )
		{
			PairHi = v;
			continue;
		}
		if ( PairLo === null )
		{
			PairLo = v;
			break;
		}
	}
	if ( PairLo === null )
		return false;
	
	const HandHi = GetNCardsWithValue( Cards, PairHi, 2 );
	const HandLo = GetNCardsWithValue( Cards, PairLo, 2 );
	return HandHi.concat( HandLo );
}

function GetOnePairHand(Cards)
{
	const Pairs = [];
	const Values = Cards.map( GetCardValue );
	for ( let v of PlayingCards.Values )
	{
		const MatchingValues = Values.filter( c => c==v );
		if ( MatchingValues.length >= 2 )
			Pairs.push( v );
	}
	if ( Pairs.length == 0 )
		return false;
	
	//	get pairs with highest value
	//	now grab any card from the best pair set
	if ( Pairs.length > 1 )
		Pairs.sort(CompareDescending);
	const Hand = GetNCardsWithValue( Cards, Pairs[0], 2 );
	return Hand;
}

function GetHighCardHand(Cards)
{
	const Values = Cards.map( GetCardValue );
	let BestIndex = 0;
	for ( let i=0;	i<Values.length;	i++ )
		if ( Values[i] > Values[BestIndex] )
			BestIndex = i;
	return [Cards[BestIndex]];
}

function GetHandScore(Cards)
{
	//	X000 + HighV gives a unique value
	function GetScore(GetHandFunc,FuncScore)
	{
		const Hand = GetHandFunc( Cards );
		if ( Hand === false )
			return 0;
		let Score = FuncScore * 1000;
		const HighCardValue = GetCardValue(Hand[0]);
		Score += HighCardValue;
		return Score;
	}
	const GetHandFuncs =
	[
	 GetStraightFlushHand,
	 GetFourOfAKindHand,
	 GetFullHouseHand,
	 GetFlushHand,
	 GetStraightHand,
	 GetThreeOfAKindHand,
	 GetTwoPairHand,
	 GetOnePairHand,
	 GetHighCardHand
	 ];
	for ( let f=0;	f<GetHandFuncs.length;	f++ )
	{
		const FuncScore = GetHandFuncs.length - f;
		const Score = GetScore( GetHandFuncs[f], FuncScore );
		if ( Score != 0 )
			return Score;
	}
	throw "Shouldn't reach here";
}


function CompareBestHands(PlayerA,PlayerB)
{
	//	need to re-classify these hands, oops. maybe need a score/id for type
	const ScoreA = GetHandScore( PlayerA.BestHand );
	const ScoreB = GetHandScore( PlayerB.BestHand );
	if ( ScoreA > ScoreB )
		return -1;
	if ( ScoreB > ScoreA )
		return 1;
	return 0;
}

function CompareHands(PlayerA,PlayerB)
{
	function Compare(CardFunc)
	{
		const a = CardFunc(PlayerA.Cards);
		const b = CardFunc(PlayerB.Cards);
		if ( a!==false && b===false )
			return -1;
		if ( a===false && b!==false )
			return 1;
		if ( a!==false && b!==false )
		{
			const HighA = GetCardValue(a[0]);
			const HighB = GetCardValue(b[0]);
			if ( HighA > HighB )
				return -1;
			if ( HighB > HighA )
				return 1;
		}
		//	tie
		return 0;
	}
	
	const StraightFlush = Compare( GetStraightFlushHand );
	if ( StraightFlush != 0 )
		return StraightFlush;
	
	const Four = Compare( GetFourOfAKindHand );
	if ( Four != 0 )
		return Four;
	
	const FullHouse = Compare( GetFullHouseHand );
	if ( FullHouse != 0 )
		return FullHouse;
	
	const Flush = Compare( GetFlushHand );
	if ( Flush != 0 )
		return Flush;
	
	const Straight = Compare( GetStraightHand );
	if ( Straight != 0 )
		return Straight;
	
	const Three = Compare( GetThreeOfAKindHand );
	if ( Three != 0 )
		return Three;
	
	const Pair2 = Compare( GetTwoPairHand );
	if ( Pair2 != 0 )
		return Pair2;
	
	const Pair = Compare( GetOnePairHand );
	if ( Pair != 0 )
		return Pair;
	
	const High = Compare( GetHighCardHand );
	if ( High != 0 )
		return High;
	
	return 0;
}

function GetBestHand(Cards)
{
	const GetHandFuncs =
	[
	 GetStraightFlushHand,
	 GetFourOfAKindHand,
	 GetFullHouseHand,
	 GetFlushHand,
	 GetStraightHand,
	 GetThreeOfAKindHand,
	 GetTwoPairHand,
	 GetOnePairHand,
	 GetHighCardHand
	 ];
	for ( let f=0;	f<GetHandFuncs.length;	f++ )
	{
		const GetHandFunc = GetHandFuncs[f];
		const Hand = GetHandFunc( Cards );
		if ( Hand === false )
			continue;
		return Hand;
	}
	throw "Shouldn't reach here, GetHighCardHand should always give a result";
}
