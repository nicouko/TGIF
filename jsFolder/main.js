const app=Vue.createApp({
    data()
    {
        return{
            members:[],
            states:statesData,      //informacion de los estados sacada del json: states.js
            statistics:[
                {
                    "partyName":"Democrats",
                    "allOfThem":[],
                    "quantity":"0",
                    "percentageVotedWParty":"0"
                },
                {
                    "partyName":"Republicans",
                    "allOfThem":[],
                    "quantity":"0",
                    "percentageVotedWParty":"0"
                },
                {
                    "partyName":"Independents",
                    "allOfThem":[],
                    "quantity":"0",
                    "percentageVotedWParty":"0"
                },
                {
                    "partyName":"Total",
                    "allOfThem":[],
                    "worstOfThem":[],
                    "bestOfThem":[],
                    "leastLoyalOfThem":[],
                    "mostLoyalOfThem":[],
                    "quantity":"0",
                    "percentageVotedWParty":"0"
                }
            ],
            tenPercent:0,
            partidos:[],
            selectedState:[]
        };
    },
    created()
    {
        const access=initialize();
        fetch(access.endpoint,access.init)
        .then(rawData => rawData.json())
        .then(cookedData => this.members=cookedData.results[0].members)
        .then(()=>{
            //LOAD PARTIES
            this.statistics[0].allOfThem=cargarPartido("D",this.members);
            this.statistics[1].allOfThem=cargarPartido("R",this.members);
            this.statistics[2].allOfThem=cargarPartido("ID",this.members);
            this.statistics[3].allOfThem=cargarPartido("all",this.members);
            //COUNT AND LOAD PARTY INDIVIDUALS
            this.statistics[0].quantity=this.statistics[0].allOfThem.length;
            this.statistics[1].quantity=this.statistics[1].allOfThem.length;
            this.statistics[2].quantity=this.statistics[2].allOfThem.length;
            this.statistics[3].quantity=this.statistics[3].allOfThem.length;
            //CALCULATE AND LOAD PARTY PERCENTAGES
            this.statistics[0].percentageVotedWParty=calculatePercentage(this.statistics[0]);
            this.statistics[1].percentageVotedWParty=calculatePercentage(this.statistics[1]);
            this.statistics[2].percentageVotedWParty=calculatePercentage(this.statistics[2]);
            this.statistics[3].percentageVotedWParty=calculatePercentage(this.statistics[3]);
            //saco el 10% del total de senadores
            this.tenPercent=(this.statistics[3].quantity*0.1).toFixed(0); 
            //
            let attendanceArray=buildData("missed_votes_pct",this.tenPercent,this.statistics);
            let partyLoyaltyArray=buildData("votes_against_party_pct",this.tenPercent,this.statistics);
            //cargo al objeto estos ultimos datos
            this.statistics[3].worstOfThem=[].concat(attendanceArray[0]);
            this.statistics[3].bestOfThem=[].concat(attendanceArray[1]);
            this.statistics[3].leastLoyalOfThem=[].concat(partyLoyaltyArray[0]);
            this.statistics[3].mostLoyalOfThem=[].concat(partyLoyaltyArray[1]);
        })
    },
    methods:
    {
        numberOfPartyVotes(totalVotes,partyPercentage)
        {
            return ((partyPercentage*totalVotes/100).toFixed(0));
        },
        toggleColor()
        {
            if(this.partidos.includes("D"))
            {
                demoCSS.style.backgroundColor= "blue";
                demoCSS.style.color="white";
            }
            else
            {
                demoCSS.style.backgroundColor= "";
                demoCSS.style.color="";
            }
            if(this.partidos.includes("R"))
            {
                repuCSS.style.backgroundColor= "red";
                repuCSS.style.color="white";
            }
            else
            {
                repuCSS.style.backgroundColor= "";
                repuCSS.style.color="";
            }
            if(this.partidos.includes("ID"))
            {
                indeDCSS.style.backgroundColor= "yellow";
            }
            else
            {
                indeDCSS.style.backgroundColor= "";
            }
        }
    },
    computed:
    {
        estadosFiltrados(){
            return this.members.filter(member => this.partidos.includes(member.party) && (this.selectedState.includes(validar(member.state)) || this.selectedState.includes("All States")))
        }
    }
});

function initialize()
{
    const init = {
        method: 'GET',
        headers:
        {"X-API-Key":"9TpSPs9WWEJazoq0YrySUhmSOrnlhRA9jR4XlnSz"}
    }
    
    //FROM WHICH HTML DO WE COME FROM?????????
    
    const path = window.location.pathname; //  path sets as: /htmlFolder/senate.html (for example)
    const page = path.split("/").pop();     //  makes an array separated by '/' and takes the last element of it
                                            //     which's 'senate.html'...   exactly what we need
    
    let endpoint;
    if (page=="congress113House.html" || page=="attendanceHouse.html" || page=="partyLoyaltyHouse.html")
    {
        endpoint="https://api.propublica.org/congress/v1/113/house/members.json";
    }
    else if(page=="congress113Senate.html" || page=="attendanceSenate.html" || page=="partyLoyaltySenate.html")
    {
        endpoint="https://api.propublica.org/congress/v1/113/senate/members.json";
    }
    const access={endpoint,init};
    return access;
}

function itsInArray(element,array)//hice esto al pedo lo podria haber hecho con un includes()
{
    for(let i=0;i<array.length;i++)
    {
        if(element==array[i])
        {
            return true;
        }
    }
    return false;
}

function buildData(percentageType,tenPercent,statistics)
{
    let worstOnes=[];
    let bestOnes=[];
    
    while(worstOnes.length<tenPercent || bestOnes.length<tenPercent)
    {
        let bestOne=statistics[3].allOfThem[2];
        let worstOne=statistics[3].allOfThem[2];
        statistics[3].allOfThem.forEach(member=>
        {
            if (worstOnes.length<tenPercent)
            {
                if(member[percentageType] > worstOne[percentageType] && !(itsInArray(member,worstOnes)))
                {
                    worstOne=member;
                }
            }
            if (bestOnes.length<tenPercent)
            {
                if(member[percentageType] < bestOne[percentageType] && (member[percentageType]!=null) && !(itsInArray(member,bestOnes)) )
                {
                    bestOne=member;
                }
            }
        })
        worstOnes.push(worstOne);
        bestOnes.push(bestOne);
    }
    return [worstOnes,bestOnes];
}

function cargarPartido(partuza,members)
{
    let array=[];
    members.forEach(member =>
        {
            member.party==partuza ? array.push(member)
            : partuza=="all" ? array.push(member):null
        });
    return array;
}

function calculatePercentage(party)
{
    let percentage=0;
    party.allOfThem.forEach(member =>
        {
            percentage+=member.votes_with_party_pct;
        });
    let average=percentage/(party.quantity);
    return (average.toFixed(2));
}

function validar(memberState)
{
    let estado;
    statesData.forEach(state=>
    {
        if (state.abbreviation==memberState)
        {
            estado=state.name;
        }
    });
    return estado;
}

app.mount("#app");