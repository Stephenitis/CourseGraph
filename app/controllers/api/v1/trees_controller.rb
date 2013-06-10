module Api
  module V1
    class TreesController < ApplicationController
      before_filter :restrict_access, :only => [:index, :show]

      respond_to :html, :json, :xml

      def index
        @courses = Course.all
        respond_with @courses
      end

      def show
        @tree = Course.find(params[:id]).to_node
        respond_with @tree
      end

      private

      def restrict_access
        if params[:access_token].present?
          restrict_access_by_params
        else
          restrict_access_by_header
        end
      end

      def restrict_access_by_params
        api_key = ApiKey.find_by_access_token(params[:access_token])
        head :unauthorized unless api_key
      end

      def restrict_access_by_header
        authenticate_or_request_with_http_token do |token, options|
          ApiKey.exists?(access_token: token)
        end
      end

    end
  end
end
