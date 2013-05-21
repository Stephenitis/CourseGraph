#1
Course.create(:SUBJ => "BIO",:TITLE => "BIOLOGY", :CRS =>001)

#2
Course.create(:SUBJ => "BIO",:TITLE => "Intro Biology", :CRS =>101)
Relationship.create(:course_id => "2",:requisite_id => "1", :mandatory => true, :type => "prerequisite" )
#3
Course.create(:SUBJ => "BIO",:TITLE => "Intro Biology II", :CRS =>102)
Relationship.create(:course_id => "3",:requisite_id => "1", :mandatory => true, :type => "prerequisite" )

#4
Course.create(:SUBJ => "BIO",:TITLE => "Ecology", :CRS => 200)
Relationship.create(:course_id => "4",:requisite_id => "2", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "4",:requisite_id => "3", :mandatory => true, :type => "prerequisite" )

#5
Course.create(:CRS => 218, :SUBJ => "BIO",:TITLE => "Cell Biology")
Relationship.create(:course_id => "5",:requisite_id => "2", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "5",:requisite_id => "3", :mandatory => true, :type => "prerequisite" )

#6
Course.create(:CRS => 310, :SUBJ => "BIO",:TITLE => "Genetics")
Relationship.create(:course_id => "6",:requisite_id => "5", :mandatory => true, :type => "prerequisite" )

#7
Course.create(:CRS => 317, :SUBJ => "BIO",:TITLE => "Ecology")
Relationship.create(:course_id => "7",:requisite_id => "5", :mandatory => true, :type => "prerequisite" )

#8
Course.create(:CRS => 301, :SUBJ => "BIO",:TITLE => "Comparative Vertebrate Anatomy")
Relationship.create(:course_id => "8",:requisite_id => "5", :mandatory => true, :type => "prerequisite" )

#9
Course.create(:CRS => 302, :SUBJ => "BIO",:TITLE => "Animal Embryology")
Relationship.create(:course_id => "9",:requisite_id => "5", :mandatory => true, :type => "prerequisite" )

#10
Course.create(:CRS => 309, :SUBJ => "BIO",:TITLE => "Entomology")
Relationship.create(:course_id => "10",:requisite_id => "5", :mandatory => true, :type => "prerequisite" )

#11
Course.create(:CRS => 416, :SUBJ => "BIO",:TITLE => "Ornithology")
Relationship.create(:course_id => "11",:requisite_id => "8", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "11",:requisite_id => "9", :mandatory => true, :type => "prerequisite" )

#12
Course.create(:CRS => 417, :SUBJ => "BIO",:TITLE => "Mammalogy")
Relationship.create(:course_id => "12",:requisite_id => "8", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "12",:requisite_id => "9", :mandatory => true, :type => "prerequisite" )


#13
Course.create(:CRS => 445, :SUBJ => "BIO",:TITLE => "Neurobiology and Behavior")
Relationship.create(:course_id => "12",:requisite_id => "8", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "12",:requisite_id => "9", :mandatory => true, :type => "prerequisite" )
Relationship.create(:course_id => "12",:requisite_id => "10", :mandatory => true, :type => "prerequisite" )

require 'csv'
# require 'fastercsv'
course_to_db = {}

CSV.foreach("campus1.csv", :headers => true) do |row|
  course = Course.create(row.to_hash)

  # turn prereqs into course objects
  # build relationship for each prereq
  course_to_db[row["SUBJ"] + ' ' + row["CRS"]] = course
end

missing_courses =[]

CSV.foreach("campus1.csv", :headers => true) do |row|
  if row["PREREQS"].nil?
    next
  end
  course = course_to_db[row["SUBJ"] + ' ' + row["CRS"]]
  row["PREREQS"].scan(/[A-Z]{2,4} ?\d{3}[LS]?/).each do |req|
    req_course = course_to_db[req]
    if req_course
      Relationship.create(course_id: course.id, requisite_id: req_course.id)
    else
      missing_courses << req
    end
  end
end

p missing_courses
