class HomeController < ApplicationController
  def index
      @courses = Course.all
  end

  def show
    @course = Course.find(params[:id])
  end

  def tree
    @tree = Course.find(params[:id]).to_node
  end
end
