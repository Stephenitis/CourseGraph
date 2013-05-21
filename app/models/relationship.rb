class Relationship < ActiveRecord::Base
  belongs_to :course
  belongs_to :requisite, :class_name => "Course"
  attr_accessible :course_id, :requisite_id, :mandatory, :type
end
