#!/usr/bin/python

import re
import sys
import os

class TemplateDef:
    def __init__(self, name, ext, parts, file):
        self.name = name
        self.ext = ext
        self.parts = parts
        self.file = file
    def Key(self):
        return self.name + "." + self.ext
    def ToStr(self):
        return self.Key() + "\tPARTS: " + ", ".join(self.parts) + "\tFILE: " + self.file
        
class TemplateInst:
    def __init__(self, name, ext, parts, file):
        self.name = name
        self.ext = ext
        self.parts = parts
        self.file = file
    def Key(self):
        return self.name + "." + self.ext
    def ToStr(self):
        return self.Key() + "\t" + self.ToStrNoName();
    def ToStrNoName(self):
        return "PARTS: " + ", ".join(self.parts) + "\tFILE: " + self.file

templateDefs = {} #TemplateDef.name + TemplateDef.ext => TemplateDef
templateInsts = {} #TemplateInst.name + TemplateInst.ext => [TemplateInst]

print "Searching recursively in " + os.path.abspath("./")
for root, dirs, files in os.walk("./"):
    for file in files:
        parts = file.split(".")
            
        if parts[-1] == 'template': #Definition
            template = TemplateDef(parts[0], parts[-2], parts[1:-2], os.path.join(root, file))
            templateDefs[template.Key()] = template
        if len(parts) >= 2 and parts[1] == 'template': #Instance
            template = TemplateInst(parts[0], parts[-1], parts[2: -1], os.path.join(root, file))
            if template.Key() not in templateInsts:
                templateInsts[template.Key()] = []
            templateInsts[template.Key()].append(template)

print "\nFound template definitions:"
for key in templateDefs:
    defi = templateDefs[key]
    print "\t" + defi.ToStr()
    
print "\nFound template instances:"
for key in templateInsts:
    for inst in templateInsts[key]:
        print "\t" + inst.ToStr()

print "\nCompiling template instances:"
for key in templateInsts:
    print "\tCompiling " + key
    if key not in templateDefs:
        print "\tERROR Cannot find template for " + key + " instances:"
        for inst in templateInsts[key]:
            print "\t\t" + inst.name + " (with extension " + inst.ext + ")."
            print "\t\t" + "in " + inst.file
    else:
        defi = templateDefs[key]
        for inst in templateInsts[key]:
            if len(defi.parts) != len(inst.parts):
                print("\tERROR definition parts length ("
                    + len(defi.parts) + ") and instance parts length (" 
                    + len(inst.parts) + ") are not equal for " + inst.ToStr())
            else:
                print "\t\t" + inst.ToStrNoName()
                #Probably should do line by line or something...
                #And also cache the definition file...
                defiText = open(defi.file, "r").read();
            
                instText = defiText #We apply the templates one at a time
            
                for defiPart, instPart in zip(defi.parts, inst.parts):
                    #Vanilla
                    defiRegex = r"" + defiPart
                    instRegex = instPart
                
                    instText = re.sub(defiRegex, instRegex, instText)
                
                    #Underscore concatention
                    defiRegex = r"[a-zA-Z_0-9]+(_" + defiPart + ")"
                    instRegex = "_" + instPart
                
                    instText = re.sub(defiRegex, instRegex, instText)
        

                open(inst.file, "w").write(instText)
            
print "\nFinished template compilation\n"