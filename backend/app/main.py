from flask import Flask,g,request
import sqlite3
import random
import os
app = Flask(__name__)

@app.route('/birth')
def birth():
    reverse=request.args.get("reverse")
    return birth(reverse)

DATABASE = './data.db'

def connect_db():
    return sqlite3.connect(DATABASE)

@app.before_request
def before_request():
    g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()

def birth(reverse):
    cur=g.db.cursor()
    
    #薪资的乘数，随着教育水平的变化而变化
    salaryMultiple=1

    #随机出生地区，使用几何概型
    seed=random.randint(0,130789)
    cur.execute("select * from districts where min<=? and max>?",(seed,seed))
    birthPlace=cur.fetchone()
    area=birthPlace[0]

    schoolList=[]

    #随机幼儿园
    cur.execute("select * from infantschool where area=?",(area,))
    schools=cur.fetchall()
    infantSchool=schools[seed%len(schools)]
    schoolList.append(school2json(infantSchool,"幼儿园"))

    #随机小学
    cur.execute("select * from primaryschool where area=?",(area,))
    schools=cur.fetchall()
    primarySchool=schools[seed%len(schools)]
    schoolList.append(school2json(primarySchool,"小学"))

    #随机初中
    cur.execute("select * from juniorhighschool where area=?",(area,))
    schools=cur.fetchall()
    juniorHighSchool=schools[seed%len(schools)]
    schoolList.append(school2json(juniorHighSchool,"初中"))

    #普通高中
    if seed%2==0:
        salaryMultiple*=1.5

        cur.execute("select * from highschool where area=?",(area,))
        schools=cur.fetchall()
        highSchool=schools[seed%len(schools)]
        schoolList.append(school2json(highSchool,"高中"))

        cur.execute("select * from ratio where province=?",(birthPlace[2],))
        ratio=cur.fetchone()
        if reverse=="true":
            ratio=(ratio[0],100-ratio[3],100-ratio[2],100-ratio[1])

        if float(seed%1000)/10<ratio[1]:
            utype="985"
            salaryMultiple*=2
        elif float(seed%1000)/10<ratio[2]:
            utype="211"
            salaryMultiple*=1.7
        elif float(seed%1000)/10<ratio[3]:
            utype="1"
            salaryMultiple*=1.5
        else:
            utype="2"
        
        university=getUniversity(utype,"大学")
        schoolList.append(university)
        
        #概率读研
        if seed%8==0:
            if utype=="985" or utype=="211":
                university=getUniversity(utype,"研究生")
                schoolList.append(university)
            else:
                utypes=["985","211","1"]
                university=getUniversity(utypes[seed%3],"研究生")
                schoolList.append(university)
            salaryMultiple*1.2

        #概率读博
        if seed%24==0:
            university=getUniversity("985","博士")
            schoolList.append(university)
            salaryMultiple*=1.5

        livingProvince=university["area"]

    #职业教育
    else:
        cur.execute("select * from professionalschool where area=?",(area,))
        schools=cur.fetchall()
        professionalschool=schools[seed%len(schools)]
        schoolList.append(school2json(professionalschool,"专科"))
        livingProvince=birthPlace[2]
    

    #概率返乡或者留在大城市
    if seed%3==0:
        livingProvince=birthPlace[2]
    elif seed%3==2:
        seed=random.randint(0,130789)
        cur.execute("select * from districts where min<=? and max>?",(seed,seed))
        livingProvince=cur.fetchone()[2]
    
    features=[ '农、林、牧、渔业', '采矿业', '制造业', '电力、热力、燃气及水生产和供应业', '建筑业', '批发和零售业', '交通运输、仓储和邮政业', '住宿和餐饮业', '信息传输、软件和技术服务业', '金融业', '房地产业', '租赁和商务服务业', '科学研究和技术服务业', '水利、环境和公共设施管理业', '居民服务、修理和其他服务业', '教育', '卫生和社会工作', '文化、体育和娱乐业']
    industry=features[seed%18]
    cur.execute("select * from salary where province=? and industry=?",(livingProvince,industry))
    salary=cur.fetchone()

    # print(birthPlace[0],infantSchool[0],primarySchool[0],juniorHighSchool[0],highSchool[0],university[0],industry,salary[2])
    json_return={
        "birthPlace":area2json(birthPlace),
        "schoolList":schoolList,
        "industry":industry2json(salary,salaryMultiple)
    }    
    
    return json_return

def getUniversity(utype,level):
    cur=g.db.cursor()
    cur.execute("select * from university where utype=?",(utype,))
    universityList=cur.fetchall()
    tup=universityList[random.randint(0,len(universityList)-1)]
    res={}
    res["level"]=level
    res["name"]=tup[0]
    res["lng"]=tup[2]
    res["lat"]=tup[3]
    res["area"]=tup[1]
    return res

def school2json(tup,level):
    res={}
    res["level"]=level
    res["name"]=tup[0]
    res["lng"]=tup[1]
    res["lat"]=tup[2]
    res["area"]=tup[3]
    return res

def area2json(tup):
    res={}
    res["area"]=tup[0]
    res["city"]=tup[1]
    res["province"]=tup[2]
    res["lng"]=tup[5]
    res["lat"]=tup[6]
    return res

def industry2json(tup,multiple):
    res={}
    res["province"]=tup[0]
    res["industry"]=tup[1]
    res["salary"]=int(tup[2]*multiple)
    return res

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 80)))