in order to see what is going wrong, let's compare our console logs from extension, how they call subtitle, and how youtube actually operates. 
1. console logs:
a) when toggled a subtitle from button inside video player bar:
[Multi-Subs] toggleSubtitle called | id="en" label="English" checked=true <anonymous code>:94:11
[Multi-Subs] Fetching VTT from: https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=en&fmt=vtt <anonymous code>:121:13
[Multi-Subs] Fetch response | status=200 ok=true <anonymous code>:124:13
[Multi-Subs] VTT received | length=0 chars <anonymous code>:131:13
[Multi-Subs] <track> appended | id="en" mode=showing <anonymous code>:152:13

b) when toggled a subtitle from the extension's menu interface:
[Multi-Subs] Received yt-multi-subs-toggle event: 
Object { id: "en", baseUrl: "https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip,ipbits,expire,v,ei,caps,opi,exp,xoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=en", label: "English", checked: true }
<anonymous code>:226:11
[Multi-Subs] toggleSubtitle called | id="en" label="English" checked=true <anonymous code>:94:11
[Multi-Subs] Fetching VTT from: https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=en&fmt=vtt <anonymous code>:121:13
[Multi-Subs] Fetch response | status=200 ok=true <anonymous code>:124:13
[Multi-Subs] VTT received | length=0 chars <anonymous code>:131:13
[Multi-Subs] <track> appended | id="en" mode=showing <anonymous code>:152:13

2. how our extension is trying to fetch (see this after viewing console logs):
a) when toggled a subtitle from button inside video player bar - Copy as fetch
await fetch("https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=en&fmt=vtt", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Alt-Used": "www.youtube.com",
        "Priority": "u=4"
    },
    "referrer": "https://www.youtube.com/watch?v=LW9XRA4641E",
    "method": "GET",
    "mode": "cors"
});
b) when toggled a subtitle from button inside video player bar - Copy Response
(No response data available for this request)

c) when toggled a subtitle from the extension's menu interface - Copy as Fetch

await fetch("https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=en&fmt=vtt", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Alt-Used": "www.youtube.com",
        "Priority": "u=0"
    },
    "referrer": "https://www.youtube.com/watch?v=LW9XRA4641E",
    "method": "GET",
    "mode": "cors"
});

d) when toggled a subtitle from the extension's menu interface - Copy Response
(No response data available for this request)

2. how youtube actually fetches:
a) Copy as fetch
await fetch("https://www.youtube.com/api/timedtext?v=LW9XRA4641E&ei=dfjnaeTbBO6ep-oP-4O06AU&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1776835301&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=C1531034D966D0A8F474EBA8A0FC1A07DCF9B1F3.5FBC496454CC10B7E52D3F8420988E8771E1B6DF&key=yt8&lang=la&potc=1&pot=MlOuC4N-xe0tAa431sFYPDIsJOsbEFux7nhnLQ6TY5Z9fhuPAAxDnqA5gPUeglYYlVO9dJKdgpmRzD1f3fSciV9g7uxWa-gaEJ20kiVDnbX1tlfbnQ%3D%3D&fmt=json3&xorb=2&xobt=3&xovt=3&cbr=Firefox&cbrver=149.0&c=WEB&cver=2.20260421.00.00&cplayer=UNIPLAYER&cos=Windows&cosver=10.0&cplatform=DESKTOP", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9",
        "X-Goog-Visitor-Id": "CgtJNHJFU012YUhWbyj18J_PBjIoCgJTSRIiEh4SHAsMDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicgP2LgAgrdAjE1LllURT1OelByV0lWSlE4NUh3OUUwbjZ0UnlhYU9xeUlPX3AxYlB0S2pZLW5VSXY5WHBrMjUyVUlHYTJjSE9WU19iZmFocjE2SWREN1Q5b2NSNmJqQ1o2TGYwM3pxUG83U0FTVXpnUUNQY2h4YmdiRnlGbm8tMnFkd1RJUXpsd09ZUUVxaC1tLTBQUi1oREFtTUFJYUtzWXN0ZWctVGJvcUtHMmFBa0hfXzdlekZjMHNmclJKd09LWGQ5a2R5WEwwR1dFb0hkdW9pUHNBTFIzTHZPYTgyM2w5d2dkVFpWM21XUFJhNm9zZVN0YlR4bFQ2NlBFckREVk5YRTczSHBPeHk3UExPZm5NeGNIR0R2dWtWZm1ZNFJUUUQ3aHN1a2xIWktiUlIzNWIyMGdfdkFxSk1QcVNiTkktR2tvVWlwanF3d1lDRmhTOHRkbUtaSXhjcG9Odjk2dWRETmc%3D",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": "2.20260421.00.00",
        "X-YouTube-Device": "cbr=Firefox&cbrver=149.0&ceng=Gecko&cengver=149.0&cos=Windows&cosver=10.0&cplatform=DESKTOP",
        "X-Youtube-Identity-Token": "QUFFLUhqa2UyWmNKeFRodWd5UE5ORHlnZ09qN1lrVkpNQXw=",
        "X-YouTube-Page-CL": "903027415",
        "X-YouTube-Page-Label": "youtube.desktop.web_20260421_00_RC00",
        "X-Goog-AuthUser": "0",
        "X-YouTube-Utc-Offset": "120",
        "X-YouTube-Time-Zone": "Europe/Ljubljana",
        "X-YouTube-Ad-Signals": "dt=1776810103516&flash=0&frm&u_tz=120&u_his=27&u_h=864&u_w=1536&u_ah=816&u_aw=1536&u_cd=24&bc=31&bih=497&biw=1434&brdim=-7%2C-7%2C-7%2C-7%2C1536%2C0%2C1550%2C830%2C1434%2C497&vis=1&wgl=true&ca_type=image",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Alt-Used": "www.youtube.com",
        "Priority": "u=0"
    },
    "referrer": "https://www.youtube.com/watch?v=LW9XRA4641E",
    "method": "GET",
    "mode": "cors"
});
b) Copy Response
{
  "wireMagic": "pb3",
  "pens": [ {
  
  } ],
  "wsWinStyles": [ {
  
  } ],
  "wpWinPositions": [ {
  
  } ],
  "events": [ {
    "tStartMs": 140,
    "dDurationMs": 6144,
    "segs": [ {
      "utf8": "Nūper invītātus apud programma Statiōnis Radiophōnicae Vātīcānae cui titulus est Anima Latīna,"
    } ]
  }, {
    "tStartMs": 6284,
    "dDurationMs": 4445,
    "segs": [ {
      "utf8": "cum Reverendissimō Valdemārō Turek Latīnē locūtus sum in undīs."
    } ]
  }, {
    "tStartMs": 10729,
    "dDurationMs": 4838,
    "segs": [ {
      "utf8": "Quamvīs apud alium canālem polýMATHY partēs nostrī colloquiī audītae sint,"
    } ]
  }, {
    "tStartMs": 15567,
    "dDurationMs": 5031,
    "segs": [ {
      "utf8": "hīc integrae cōnfābulātiōnēs auscultantur. Eccās!"
    } ]
  }, {
    "tStartMs": 20598,
    "dDurationMs": 3528,
    "segs": [ {
      "utf8": "Certē! Quid invēnistī ipse, magister? "
    } ]
  }, {
    "tStartMs": 24126,
    "dDurationMs": 2759,
    "segs": [ {
      "utf8": "Sed quā dē rē agitur?"
    } ]
  }, {
    "tStartMs": 26885,
    "dDurationMs": 2286,
    "segs": [ {
      "utf8": "Quid putās dē —"
    } ]
  }, {
    "tStartMs": 30000,
    "dDurationMs": 1578,
    "segs": [ {
      "utf8": "dē hāc rē."
    } ]
  }, {
    "tStartMs": 31578,
    "dDurationMs": 4422,
    "segs": [ {
      "utf8": "Loquunturne etiamnunc sacerdōtēs Vātīcānī Latīnē?"
    } ]
  }, {
    "tStartMs": 36000,
    "dDurationMs": 5468,
    "segs": [ {
      "utf8": "Paucissimī sunt sacerdōtēs in Cīvitāte Vātīcānā quī loquuntur Latīnē."
    } ]
  }, {
    "tStartMs": 41468,
    "dDurationMs": 4813,
    "segs": [ {
      "utf8": "Forsitan multī frequentāvērunt curricula et studia "
    } ]
  }, {
    "tStartMs": 46281,
    "dDurationMs": 2188,
    "segs": [ {
      "utf8": "in variīs nātiōnibus,"
    } ]
  }, {
    "tStartMs": 48469,
    "dDurationMs": 3350,
    "segs": [ {
      "utf8": "tamen paucissimī sunt illī quī"
    } ]
  }, {
    "tStartMs": 51819,
    "dDurationMs": 3027,
    "segs": [ {
      "utf8": "possunt loquī dē omnibus rēbus,"
    } ]
  }, {
    "tStartMs": 54846,
    "dDurationMs": 2890,
    "segs": [ {
      "utf8": "et quibusdam aliīs tī ita dīcitur"
    } ]
  }, {
    "tStartMs": 58446,
    "dDurationMs": 5032,
    "segs": [ {
      "utf8": "forsitan nōn est plūs nōbīs ista prāxis et trāditiō"
    } ]
  }, {
    "tStartMs": 63478,
    "dDurationMs": 2631,
    "segs": [ {
      "utf8": "ūsque ad Concilium Vātīcānum Secundum"
    } ]
  }, {
    "tStartMs": 66109,
    "dDurationMs": 5115,
    "segs": [ {
      "utf8": "ferē omnēs sacerdōtēs Ecclēsiasticī loquebantur Latīnē"
    } ]
  }, {
    "tStartMs": 71224,
    "dDurationMs": 5315,
    "segs": [ {
      "utf8": "posteā trānsiērunt multae mūtātiōnēs"
    } ]
  }, {
    "tStartMs": 76539,
    "dDurationMs": 5172,
    "segs": [ {
      "utf8": "et hodiē etiam in sēmināriīs sunt quaedam curricula"
    } ]
  }, {
    "tStartMs": 81711,
    "dDurationMs": 3127,
    "segs": [ {
      "utf8": "tamen agitur nōn dē facultāte loquendī, "
    } ]
  }, {
    "tStartMs": 84838,
    "dDurationMs": 3986,
    "segs": [ {
      "utf8": "sed dē facultāte, exemplī grātiā, legendī, prōnūntiandī"
    } ]
  }, {
    "tStartMs": 88824,
    "dDurationMs": 5860,
    "segs": [ {
      "utf8": "et potissimum dē intelligendō textūs Latīnōs et Graecōs"
    } ]
  }, {
    "tStartMs": 94684,
    "dDurationMs": 8521,
    "segs": [ {
      "utf8": "quī māximum cōnstituunt ūsque ad nostrum tempus thēsaurum"
    } ]
  }, {
    "tStartMs": 103205,
    "dDurationMs": 4249,
    "segs": [ {
      "utf8": "tum quod pertinet ad disciplīnās theologicās, philosophicās"
    } ]
  }, {
    "tStartMs": 107454,
    "dDurationMs": 3452,
    "segs": [ {
      "utf8": "sed etiam ad disciplīnās nostrae aetātis"
    } ]
  }, {
    "tStartMs": 110906,
    "dDurationMs": 4836,
    "segs": [ {
      "utf8": "quia, sī cōnsīderāmus, exemplī grātiā, prōvinciam oecologicam"
    } ]
  }, {
    "tStartMs": 115742,
    "dDurationMs": 2292,
    "segs": [ {
      "utf8": "vel prōvinciam commūnicātiōnis socialis"
    } ]
  }, {
    "tStartMs": 118034,
    "dDurationMs": 3140,
    "segs": [ {
      "utf8": "multa sunt nōbīs vocābula"
    } ]
  }, {
    "tStartMs": 121174,
    "dDurationMs": 4890,
    "segs": [ {
      "utf8": "quae rādīcem habent in sermōne Graecō vel in sermōne Latīnō"
    } ]
  }, {
    "tStartMs": 126064,
    "dDurationMs": 4213,
    "segs": [ {
      "utf8": "et tenētur omnīno dē nāvitāte nostrā"
    } ]
  }, {
    "tStartMs": 130277,
    "dDurationMs": 4420,
    "segs": [ {
      "utf8": "et dē operā nostrā in Secrētāriō Statūs"
    } ]
  }, {
    "tStartMs": 134697,
    "dDurationMs": 5220,
    "segs": [ {
      "utf8": "quia multa documenta parantur etiam hodiē in sermōne Latīnō"
    } ]
  }, {
    "tStartMs": 139917,
    "dDurationMs": 3053,
    "segs": [ {
      "utf8": "et posteā pūblicī jūris"
    } ]
  }, {
    "tStartMs": 142970,
    "dDurationMs": 4109,
    "segs": [ {
      "utf8": "sunt ācta Apostolicae Sēdis"
    } ]
  }, {
    "tStartMs": 147079,
    "dDurationMs": 4654,
    "segs": [ {
      "utf8": "et sunt quōdammodō, ut ita dīcam, pūnctum cōnsīderātiōnis"
    } ]
  }, {
    "tStartMs": 151733,
    "dDurationMs": 7150,
    "segs": [ {
      "utf8": "et pūnctum meditātiōnis dē rēbus quae hodiē"
    } ]
  }, {
    "tStartMs": 158883,
    "dDurationMs": 3301,
    "segs": [ {
      "utf8": "omnīnō majōris vel māximī sunt mōmentī."
    } ]
  }, {
    "tStartMs": 162184,
    "dDurationMs": 4960,
    "segs": [ {
      "utf8": "Ergō oportet etiamnunc sacerdōtēs discere linguam Latīnam?"
    } ]
  }, {
    "tStartMs": 167144,
    "dDurationMs": 1813,
    "segs": [ {
      "utf8": "Omnīnō, omnīno!"
    } ]
  }, {
    "tStartMs": 168957,
    "dDurationMs": 762,
    "segs": [ {
      "utf8": "Ut loquantur?"
    } ]
  }, {
    "tStartMs": 169719,
    "dDurationMs": 3362,
    "segs": [ {
      "utf8": "Variās ob causā. Haec est alia quaestiō, quia"
    } ]
  }, {
    "tStartMs": 173081,
    "dDurationMs": 7458,
    "segs": [ {
      "utf8": "nōs possumus discere sermōnem Latīnum ob variās causās"
    } ]
  }, {
    "tStartMs": 180539,
    "dDurationMs": 3955,
    "segs": [ {
      "utf8": "potissimum quia cōnstituunt fontēs, nōn?"
    } ]
  }, {
    "tStartMs": 184494,
    "dDurationMs": 2341,
    "segs": [ {
      "utf8": "historiae, theologiae, philosophiae"
    } ]
  }, {
    "tStartMs": 186835,
    "dDurationMs": 5175,
    "segs": [ {
      "utf8": "hodiē nesciō sī sint in ūniversō, in orbe"
    } ]
  }, {
    "tStartMs": 192010,
    "dDurationMs": 3353,
    "segs": [ {
      "utf8": "prōfessōrēs, magistrī quī aptī sint"
    } ]
  }, {
    "tStartMs": 195363,
    "dDurationMs": 5394,
    "segs": [ {
      "utf8": "ad istud opus, quia nōn est opus facile! hodiē loquī."
    } ]
  }, {
    "tStartMs": 200757,
    "dDurationMs": 3323,
    "segs": [ {
      "utf8": "Nesciō sī possum, sī licet mihi,"
    } ]
  }, {
    "tStartMs": 204080,
    "dDurationMs": 2847,
    "segs": [ {
      "utf8": "quaedam etiam Latīnē dīcere"
    } ]
  }, {
    "tStartMs": 206927,
    "dDurationMs": 2853,
    "segs": [ {
      "utf8": "quia omnīnō oblītus sum"
    } ]
  }, {
    "tStartMs": 209780,
    "dDurationMs": 1499,
    "segs": [ {
      "utf8": "Venī hūc, Monsignore!"
    } ]
  }, {
    "tStartMs": 211279,
    "dDurationMs": 2766,
    "segs": [ {
      "utf8": "et trādere tibi volūmen"
    } ]
  }, {
    "tStartMs": 214045,
    "dDurationMs": 3530,
    "segs": [ {
      "utf8": "cui titulus est Breviloquia Francīscī Pāpae"
    } ]
  }, {
    "tStartMs": 225752,
    "dDurationMs": 2982,
    "segs": [ {
      "utf8": "sunt breviloquia [pīpiātiōnēs] vidēlicet \"tweet\""
    } ]
  }, {
    "tStartMs": 228734,
    "dDurationMs": 7236,
    "segs": [ {
      "utf8": "nōs titulum dedimus sententiīs, \"tweet,\" \"breviloquia\""
    } ]
  }, {
    "tStartMs": 235970,
    "dDurationMs": 2838,
    "segs": [ {
      "utf8": "quia etymologia est vēra propria"
    } ]
  }, {
    "tStartMs": 238808,
    "dDurationMs": 3292,
    "segs": [ {
      "utf8": "quod sibi vult \"tweet\""
    } ]
  }, {
    "tStartMs": 242100,
    "dDurationMs": 4898,
    "segs": [ {
      "utf8": "et sunt sententiae Summī Pontificis Francīscī"
    } ]
  }, {
    "tStartMs": 246998,
    "dDurationMs": 3431,
    "segs": [ {
      "utf8": "compositae Italicē et Latīnē"
    } ]
  }, {
    "tStartMs": 250429,
    "dDurationMs": 2766,
    "segs": [ {
      "utf8": "et trānslātiō Latīna est opus nostrum"
    } ]
  }, {
    "tStartMs": 253195,
    "dDurationMs": 3127,
    "segs": [ {
      "utf8": "quod dat nōbīs, quod offert nōbīs dēlectāmentum"
    } ]
  }, {
    "tStartMs": 256322,
    "dDurationMs": 2851,
    "segs": [ {
      "utf8": "et etiam optimam occāsiōnem"
    } ]
  }, {
    "tStartMs": 259173,
    "dDurationMs": 7140,
    "segs": [ {
      "utf8": "ad sermōnem Latīnum etiam hominubus nostrae aetātis praebēre"
    } ]
  }, {
    "tStartMs": 266313,
    "dDurationMs": 2825,
    "segs": [ {
      "utf8": "et dōnō tib, trādō volūmen"
    } ]
  }, {
    "tStartMs": 269138,
    "dDurationMs": 4490,
    "segs": [ {
      "utf8": "sīcut testimōnium nostrae audītiōnis"
    } ]
  }, {
    "tStartMs": 273628,
    "dDurationMs": 4065,
    "segs": [ {
      "utf8": "nostrī dialogī dē Latīnitāte"
    } ]
  }, {
    "tStartMs": 277693,
    "dDurationMs": 2668,
    "segs": [ {
      "utf8": "et semper dē pondere, dīxerim,"
    } ]
  }, {
    "tStartMs": 280361,
    "dDurationMs": 5121,
    "segs": [ {
      "utf8": "dē monumentō et dē mōmentō istīus linguae"
    } ]
  }, {
    "tStartMs": 285482,
    "dDurationMs": 3310,
    "segs": [ {
      "utf8": "quia omnīnō māximum, sīcut jam dīximus"
    } ]
  }, {
    "tStartMs": 288792,
    "dDurationMs": 3938,
    "segs": [ {
      "utf8": "cōnstituit thēsaurum prō cultūrā et nostrae aetātis."
    } ]
  }, {
    "tStartMs": 292730,
    "dDurationMs": 2624,
    "segs": [ {
      "utf8": "Mihi nunc est properandum."
    } ]
  }, {
    "tStartMs": 296896,
    "dDurationMs": 3670,
    "segs": [ {
      "utf8": "Summās tibi et vōbīs omnibus singulīs grātiās agō"
    } ]
  }, {
    "tStartMs": 300661,
    "dDurationMs": 4350,
    "segs": [ {
      "utf8": "Grātiās māximās et etiam omnibus quī cultōrēs sunt Latīnitātis in Americā"
    } ]
  }, {
    "tStartMs": 305011,
    "dDurationMs": 2101,
    "segs": [ {
      "utf8": "tum Septentriōnālī cum Merīdiōnālī."
    } ]
  }, {
    "tStartMs": 307112,
    "dDurationMs": 1831,
    "segs": [ {
      "utf8": "Certissimē! Valē!"
    } ]
  } ]
}
