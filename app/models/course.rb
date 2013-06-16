class Course < ActiveRecord::Base
  has_many :relationships
  has_many :requisites, :through => :relationships
  has_many :inverse_relationships, :class_name => "Relationship", :foreign_key => "requisite_id"
  has_many :inverse_requisites, :through => :inverse_relationships, :source => :course
  # scope :prerequisites, where(:)
  attr_accessible  :SEC, :INSTRUCTORS, :CRN, :MIN_CRED, :MAX_CRED, :DAYS, :TIME, :RM_CAP, :ENRL, :GLOB_CAP, :LOC_CAP, :AVAIL, :STAT, :FIRECAP, :CAMPUS, :COLLEGE, :LEVEL, :COREQS, :RESTRICTIONS, :PREREQS, :COMMENTS, :SUBJ, :CRS, :TITLE, :COMMENTS

  self.per_page = 10

  def to_node
    { "id" => self.id,
      "name" => self.SUBJ + self.CRS + ":" + self.TITLE,
      "data" => self,
      "children"   => self.inverse_requisites.map { |c| c.to_node }
    }
  end

  def self.to_csv
    CSV.generate do |csv|
      csv << column_names
      all.each do |course|
        csv << course.attributes.values_at(*column_names)
      end
    end
  end

end
